import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { registerSocketHandlers } from './sockets/socketHandler';
import { RoomManager } from './services/RoomManager';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup CORS
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

// Register all WebSocket Handlers
registerSocketHandlers(io);

// REST API Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  const roomManager = RoomManager.getInstance();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: roomManager.getRoomCount(),
    name: 'Syncora Watch Party Engine',
  });
});

app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
  const roomId = req.params.roomId as string;
  const roomManager = RoomManager.getInstance();
  const room = roomManager.getRoom(roomId);

  if (!room) {
    return res.status(404).json({ exists: false, message: 'Room not found' });
  }

  return res.json({
    exists: true,
    roomId: room.id,
    participantCount: room.getParticipantCount(),
    videoId: room.getPlaybackState().videoId,
    playState: room.getPlaybackState().playState,
  });
});

// Production: serve built static client files
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (_req: Request, res: Response) => {
  // If not an API request, serve index.html for React SPA
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // In dev mode when client isn't built yet, provide friendly message
      res.status(200).json({
        message: 'Syncora Backend Running. Frontend is served by Vite dev server in development mode.',
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`
  ======================================================
     ✨ Syncora Watch Party Server is Online! ✨
     Port: ${PORT}
     WebSockets: Enabled
     Client URL: ${CLIENT_URL}
  ======================================================
  `);
});
