
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Page } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { IEventToLog, postToDiscord } from 'lib/log/userEvents';
import { computeUserPagePermissions } from '../permissions/pages/page-permission-compute';
import { PageOperationType } from '../permissions/pages/page-permission-interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createPage);

async function createPage (req: NextApiRequest, res: NextApiResponse<Page>) {
  const data = req.body as Prisma.PageCreateInput;
  const page = await prisma.page.create({ data });
  logFirstWorkspacePageCreation(page);
  logFirstUserPageCreation(page);
  return res.status(200).json(page);
}

export default withSessionRoute(handler);

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
async function logFirstWorkspacePageCreation (page: Page) {
  const workspaceCreatedPages = await prisma.page.count({
    where: {
      spaceId: page.spaceId,
      autoGenerated: {
        not: true
      }
    }
  });

  // Default page plus the just created page
  if (workspaceCreatedPages === 1) {

    const space = await prisma.space.findUnique({
      where: {
        id: page.spaceId!
      }
    });

    const eventLog: IEventToLog = {
      eventType: 'first_workspace_create_page',
      funnelStage: 'activation',
      message: `First page created in ${space!.domain} workspace`
    };

    postToDiscord(eventLog);
  }
}

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
async function logFirstUserPageCreation (page: Page) {
  const userCreatedPages = await prisma.page.count({
    where: {
      createdBy: page.createdBy,
      autoGenerated: {
        not: true
      }
    }
  });

  // Default page plus the just created page
  if (userCreatedPages === 1) {

    const space = await prisma.space.findUnique({
      where: {
        id: page.spaceId!
      }
    });

    const eventLog: IEventToLog = {
      eventType: 'first_user_create_page',
      funnelStage: 'activation',
      message: `A user just created their first page. This happened in the ${space!.domain} workspace`
    };

    postToDiscord(eventLog);
  }
}

/**
 * Enforce page permissions on an API endpoint
 * Requires a logged in user
 */
export function requirePagePermissions (
  requiredPermissions: PageOperationType [],
  routeHandler: (req: NextApiRequest, res: NextApiResponse<Page>) => any
) {

  return async function anonymous (req: NextApiRequest, res: NextApiResponse) {
    const pageId = req.query.id as string ?? req.body.id as string ?? req.query.pageId as string ?? req.body.pageId as string;

    if (!pageId) {
      return res.status(400).send({
        error: 'Please provide a valid page ID'
      });
    }

    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).send({
        error: 'You must be logged in'
      });
    }

    const permissionSet = await computeUserPagePermissions({
      pageId,
      userId
    });

    for (const permission of requiredPermissions) {
      if (permissionSet[permission] !== true) {
        return res.status(401).json({
          error: 'You are not allowed to perform this action'
        });
      }
    }

    return routeHandler(req, res);

  };

}
