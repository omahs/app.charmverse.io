import { SystemError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import cors from '@koa/cors';
import { getIronSession } from 'iron-session';
import Koa from 'koa';

import type { SessionData } from 'lib/session/config';
import { getIronOptions } from 'lib/session/getIronOptions';

import { isDevEnv, isTestEnv } from './constants';
import { logRoutes } from './logRoutes';
import rootRouter from './routes';

export const app = new Koa();

// CORS middleware configuration
app.use(
  cors({
    origin: (ctx) => {
      // always pass health check. (the AWS load balancer does not send origin header)
      const path = ctx.request.path;
      if (path === '/api/health') {
        return '*';
      }
      const origin = ctx.request.headers.origin;
      // allow all origins in development and test environments
      if (origin && (isDevEnv || isTestEnv)) {
        return origin;
        // support any subdomain for staging and production
      } else if (origin?.endsWith('.charmverse.co') || origin?.endsWith('.charmverse.io')) {
        return origin;
      }
      log.warn('Origin not allowed', { path, headers: ctx.request.headers });
      return ''; // Disallow the request if the origin is not allowed
    },
    credentials: true
  })
);

// Session middleware
app.use(async (ctx, next) => {
  ctx.request.session = await getIronSession<SessionData>(ctx.req, ctx.res, getIronOptions());
  await next();
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    log.error('Route error', { error: err, body: ctx.body, requestUrl: ctx.request.url });
    if (err instanceof SystemError) {
      ctx.body = {
        message: err.message,
        severity: err.severity
      };
      ctx.status = err.code;
    } else {
      ctx.body = {
        message: (err as any).message ?? 'Internal Server Error'
      };
      ctx.status = 500;
    }
  }
});

// JSON Body parser middleware
app.use(async (ctx, next) => {
  let data = '';
  await new Promise<void>((resolve, reject) => {
    ctx.req.on('data', (chunk) => {
      data += chunk;
    });
    ctx.req.on('end', () => {
      resolve();
    });
    ctx.req.on('error', (err) => {
      reject(err);
    });
  });

  try {
    ctx.request.body = JSON.parse(data);
  } catch (err) {
    ctx.request.body = data;
  }

  await next();
});

rootRouter.get('/api/health', (ctx) => {
  ctx.body = { success: true };
  ctx.status = 200;
});

app.use(rootRouter.routes()).use(rootRouter.allowedMethods());

logRoutes(rootRouter);
