import { Router } from 'express';
import { getUserAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getUserAnalytics);

export default router;
