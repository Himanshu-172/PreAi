import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/me', authenticate, getMe);

export default router;
