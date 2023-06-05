import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { votePageComment } from 'lib/pages/comments/votePageComment';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .use(requireUser)
  .put(commentVoteHandler);

async function commentVoteHandler(req: NextApiRequest, res: NextApiResponse) {
  const { id: pageId, commentId } = req.query as any as { id: string; commentId: string };
  const userId = req.session.user.id;
  const { upvoted } = req.body;

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.comment !== true) {
    throw new ActionNotPermittedError('You do not have permission to vote comments on this page');
  }

  await votePageComment({
    pageId,
    userId,
    upvoted,
    commentId
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
