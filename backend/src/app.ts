import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './errors/errorHandler.js';
import memberRoutes from './routes/memberRoutes.js';

export const prisma = new PrismaClient();

export function createApp(): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check — proves the database connection works
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
      console.error('Database health check failed:', err);
      res.status(500).json({ status: 'error', database: 'disconnected' });
    }
  });

  app.use('/members', memberRoutes);

  app.use(errorHandler);

  return app;
}
