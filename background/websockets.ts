import { createServer } from 'http';

import { Server } from 'socket.io';

import { baseUrl } from 'config/constants';
import log from 'lib/log';
import { relay } from 'lib/websockets/relay';

import app from './server/app';

const port = process.env.PORT || 3001;

const server = createServer(app.callback());

const io = new Server(server, {
  cors: {
    allowedHeaders: ['authorization'],
    credentials: true,
    origin: baseUrl || '*.charmverse.co' // use wildcard for staging
  }
});

relay.bindServer(io);

server.listen(port);

log.info('Web socket server listening to port: ', port);
