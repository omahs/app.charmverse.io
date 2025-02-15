import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { voteForumPost } from 'lib/forums/posts/voteForumPost';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(voteForumPostHandler);

async function voteForumPostHandler(req: NextApiRequest, res: NextApiResponse) {
  const { postId } = req.query as any as { postId: string };
  const userId = req.session.user.id;
  const { upvoted } = req.body;

  await voteForumPost({
    postId,
    userId,
    upvoted
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
