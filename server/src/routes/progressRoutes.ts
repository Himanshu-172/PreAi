import { Router } from 'express';
import { getProgress, saveProgress, updateProgress } from '../controllers/progressController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getProgress);
router.post('/', saveProgress);
router.patch('/:questionId', updateProgress);

export default router;
