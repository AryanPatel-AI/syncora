import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { SERVER_CONFIG } from './config/constants';
import apiRoutes from './routes/apiRoutes';
import { registerSocketHandlers } from './sockets/socketHandler';
import { initDatabase } from './database/db';

// Initialize SQLite schema
initDatabase();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Parse allowed frontend origins from FRONTEND_URL or CLIENT_URL (supports comma-separated origins)
const rawFrontendUrls = process.env.FRONTEND_URL || process.env.CLIENT_URL || SERVER_CONFIG.CLIENT_URL || '';
const envOrigins = rawFrontendUrls
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));
const isProduction = process.env.NODE_ENV === 'production';

// Origin validator shared across Express and Socket.IO
const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Server-to-server, curl, mobile apps
  const normalized = origin.trim().replace(/\/+$/, '');
  if (!isProduction || allowedOrigins.includes('*') || allowedOrigins.includes(normalized)) {
    return true;
  }
  // Seamlessly allow all Vercel deployment domains (production & preview URLs)
  if (/^https:\/\/[a-zA-Z0-9_\-.]+\.vercel\.app$/.test(normalized)) {
    return true;
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());

// Socket.IO Server configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Socket.IO CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Register WebSocket Handlers
registerSocketHandlers(io);

// Health check endpoint for cloud monitoring & Render zero-downtime deploys
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'Syncora Watch Party Backend',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

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

const effectivePort = Number(process.env.PORT) || SERVER_CONFIG.PORT;

server.listen(effectivePort, () => {
  console.log(`
  ======================================================
     ✨ Syncora Watch Party Server is Online! ✨
     Port: ${effectivePort}
     WebSockets: Enabled (HTTPS/WSS ready)
     Allowed Frontend Origins: ${allowedOrigins.join(', ')}
  ======================================================
  `);
});
