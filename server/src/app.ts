import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import chatRouter from './routes/chat';
import environmentalRouter from './routes/environmental';

dotenv.config();

const app = express();

// Security and middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '5mb' }));

import { globalRedis } from './services/redisService';
import { globalMongo } from './services/mongoService';

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'Darukaa.Earth AI Environmental Intelligence',
    storage: {
      mongodb: globalMongo.getStatus(),
      redis: {
        connected: globalRedis.isLive()
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Main API Routes
app.use('/api/chat', chatRouter);
app.use('/api/environmental', environmentalRouter);

// Production Static Serving (Single-bundle Fullstack Deployment)
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled System Error]', err);
  res.status(500).json({
    error: 'Internal Environmental Intelligence Error',
    message: err.message
  });
});

export default app;
