import { Router } from 'express';
import { getQuestion, getQuestions, runQuestionCode, submitQuestionCode } from '../controllers/questionsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getQuestions);
router.post('/:id/run', runQuestionCode);
router.post('/:id/submit', submitQuestionCode);
router.get('/:id', getQuestion);

export default router;
