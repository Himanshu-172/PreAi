import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173'
  })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

app.use(errorHandler);

export default app;
