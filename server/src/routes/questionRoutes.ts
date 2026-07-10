import { Router } from 'express';
import { getQuestion, getQuestions } from '../controllers/questionsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getQuestions);
router.get('/:id', getQuestion);

export default router;
