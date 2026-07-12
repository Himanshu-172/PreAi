import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';

const app = express();
const localhostOriginPattern = /^http:\/\/localhost:\d+$/;
const isProduction = process.env.NODE_ENV === 'production';
const productionClientUrl = process.env.CLIENT_URL;

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (!isProduction && localhostOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(null, productionClientUrl ? origin === productionClientUrl : false);
    }
  })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/resume', resumeRoutes);

app.use(errorHandler);

export default app;
