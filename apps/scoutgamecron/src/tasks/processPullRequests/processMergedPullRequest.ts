import { log } from '@charmverse/core/log';
import type { GemsReceiptType, GithubRepo } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getFormattedWeek, getWeekStartEnd, streakWindow, currentSeason, isSameDay } from '@packages/scoutgame/utils';

import type { PullRequest } from './getPullRequests';
import { getRecentPullRequestsByUser } from './getRecentPullRequestsByUser';

type RepoInput = Pick<GithubRepo, 'defaultBranch'>;

export async function processMergedPullRequest({
  pullRequest,
  repo,
  isFirstMergedPullRequest: _isFirstMergedPullRequest,
  now = new Date()
}: {
  pullRequest: PullRequest;
  repo: RepoInput;
  isFirstMergedPullRequest?: boolean;
  now?: Date;
}) {
  if (!pullRequest.mergedAt) {
    throw new Error('Pull request was not merged');
  }
  const week = getFormattedWeek(now);
  const { start, end } = getWeekStartEnd(now);

  const previousGitEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: pullRequest.author.id,
      // streaks are based on created date
      createdAt: {
        gte: new Date(new Date(pullRequest.createdAt).getTime() - streakWindow)
      },
      type: 'merged_pull_request'
    },
    select: {
      id: true,
      createdAt: true,
      pullRequestNumber: true,
      repoId: true,
      createdBy: true,
      builderEvent: {
        select: {
          createdAt: true,
          week: true,
          gemsReceipt: {
            select: {
              value: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const existingGithubEvent = previousGitEvents.some((event) => event.pullRequestNumber === pullRequest.number);
  if (existingGithubEvent) {
    // already processed
    return;
  }

  // check our data to see if this is the first merged PR, and if so, check the Github API to confirm
  const totalMergedPullRequests = await prisma.githubEvent.count({
    where: {
      createdBy: pullRequest.author.id,
      repoId: pullRequest.repository.id,
      type: 'merged_pull_request'
    }
  });

  let isFirstMergedPullRequest = _isFirstMergedPullRequest ?? totalMergedPullRequests === 0;
  if (isFirstMergedPullRequest) {
    // double-check using Github API in case the previous PR was not recorded by us
    const prs = await getRecentPullRequestsByUser({
      defaultBranch: repo.defaultBranch,
      repoNameWithOwner: pullRequest.repository.nameWithOwner,
      username: pullRequest.author.login
    });
    if (prs.filter((pr) => pr.number !== pullRequest.number).length > 0) {
      isFirstMergedPullRequest = false;
    }
  }

  const existingGithubEventToday = previousGitEvents.some((event) => {
    if (event.repoId !== pullRequest.repository.id) {
      return false;
    }

    return isSameDay(event.createdAt);
  });

  await prisma.$transaction(async (tx) => {
    const githubUser = await tx.githubUser.upsert({
      where: {
        id: pullRequest.author.id
      },
      create: {
        id: pullRequest.author.id,
        login: pullRequest.author.login
      },
      update: {}
    });

    const event = await tx.githubEvent.create({
      data: {
        pullRequestNumber: pullRequest.number,
        title: pullRequest.title,
        type: 'merged_pull_request',
        createdBy: pullRequest.author.id,
        isFirstPullRequest: isFirstMergedPullRequest,
        repoId: pullRequest.repository.id,
        url: pullRequest.url,
        createdAt: pullRequest.createdAt,
        completedAt: pullRequest.mergedAt
      }
    });

    if (githubUser.builderId && !existingGithubEventToday) {
      const builder = await tx.scout.findUniqueOrThrow({
        where: {
          id: githubUser.builderId
        },
        select: {
          bannedAt: true,
          builder: true
        }
      });

      if (builder.bannedAt || !builder.builder) {
        return;
      }

      const weeklyBuilderEvents = previousGitEvents.filter((e) => e.builderEvent).length;
      const threeDayPrStreak = weeklyBuilderEvents % 3 === 2;
      const gemReceiptType: GemsReceiptType = isFirstMergedPullRequest
        ? 'first_pr'
        : threeDayPrStreak
        ? 'third_pr_in_streak'
        : 'regular_pr';

      // this is the date the PR was merged, which determines the season/week that it counts as a builder event
      const pullRequestDate = new Date(pullRequest.mergedAt || 0);
      const builderEventDate = pullRequestDate;
      const gemValue = gemReceiptType === 'first_pr' ? 10 : gemReceiptType === 'third_pr_in_streak' ? 3 : 1;

      if (builderEventDate >= start.toJSDate()) {
        await tx.builderEvent.upsert({
          where: {
            githubEventId: event.id
          },
          create: {
            builderId: githubUser.builderId,
            createdAt: builderEventDate,
            season: currentSeason,
            week,
            type: 'merged_pull_request',
            githubEventId: event.id,
            gemsReceipt: {
              create: {
                type: gemReceiptType,
                value: gemValue,
                createdAt: builderEventDate
              }
            }
          },
          update: {}
        });
        const thisWeekEvents = previousGitEvents.filter((e) => e.createdAt > start.toJSDate());

        const gemsCollected = thisWeekEvents.reduce((acc, e) => {
          if (e.builderEvent?.gemsReceipt?.value && e.builderEvent.createdAt < builderEventDate) {
            return acc + e.builderEvent.gemsReceipt.value;
          }
          return acc;
        }, gemValue);

        await tx.userWeeklyStats.upsert({
          where: {
            userId_week: {
              userId: githubUser.builderId,
              week
            }
          },
          create: {
            userId: githubUser.builderId,
            week,
            gemsCollected
          },
          update: {
            gemsCollected
          }
        });
        log.info('Recorded a merged PR', {
          userId: githubUser.builderId,
          week,
          url: pullRequest.url,
          eventCount: thisWeekEvents.length + 1,
          gemsCollected
        });
      }
    }
  });
}
