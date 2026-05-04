import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { sqlite, db } from './db';
import { buildWsHandler } from './ws/handler';

const port = process.env.PORT ?? 3001;
const server = http.createServer(app);
const { handleUpgrade } = buildWsHandler({ sqlite, db });

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/ws') handleUpgrade(req, socket, head);
  else socket.destroy();
});

server.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
