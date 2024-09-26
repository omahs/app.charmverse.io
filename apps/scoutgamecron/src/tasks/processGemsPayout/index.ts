import { log } from '@charmverse/core/log';
import { getCurrentWeek } from '@packages/scoutgame/dates';
import { getBuildersLeaderboard } from '@packages/scoutgame/getBuildersLeaderboard';
import { DateTime } from 'luxon';

import { processScoutPointsPayout } from './processScoutPointsPayout';

export async function processGemsPayout() {
  const now = DateTime.utc();
  const week = getCurrentWeek();
  if (now.weekday !== 7 || now.hour !== 0) {
    log.info('Not Sunday at 12:00 AM NY timezone, skipping gems payout');
    return;
  }

  const topWeeklyBuilders = await getBuildersLeaderboard({ quantity: 100, week });

  for (const { builder, gemsCollected, rank } of topWeeklyBuilders) {
    try {
      await processScoutPointsPayout({ builderId: builder.id, rank, gemsCollected, week });
    } catch (error) {
      log.error(`Error processing scout points payout for builder ${builder.id}: ${error}`);
    }
  }

  log.info(`Processed ${topWeeklyBuilders.length} builders points payout`);
}
