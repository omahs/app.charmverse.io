import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { loginWithGoogle } from 'lib/google/loginWithGoogle';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { saveSession } from 'lib/middleware/saveSession';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['accessToken'], 'body')).post(loginWithGoogleController);

async function loginWithGoogleController(req: NextApiRequest, res: NextApiResponse) {
  const loginRequest = req.body as LoginWithGoogleRequest;

  const loggedInUser = await loginWithGoogle(loginRequest);

  await saveSession({ req, userId: loggedInUser.id });

  res.status(200).send(loggedInUser);
}

export default withSessionRoute(handler);
