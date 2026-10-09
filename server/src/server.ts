import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { SERVER_CONFIG } from './config/constants';
import apiRoutes from './routes/apiRoutes';
import { registerSocketHandlers } from './sockets/socketHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(express.json());

// Socket.IO Server configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Register WebSocket Handlers
registerSocketHandlers(io);

// Mount REST API Routes
app.use('/api', apiRoutes);

// Static client assets in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).json({
        service: 'Syncora Watch Party Backend',
        status: 'online',
        message: 'Frontend is running in development mode on port 5173.',
      });
    }
  });
});

server.listen(SERVER_CONFIG.PORT, () => {
  console.log(`
  ======================================================
     ✨ Syncora Watch Party Server is Online! ✨
     Port: ${SERVER_CONFIG.PORT}
     WebSockets: Enabled
     Client URL: ${SERVER_CONFIG.CLIENT_URL}
  ======================================================
  `);
});
