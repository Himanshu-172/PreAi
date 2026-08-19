import { Router } from 'express';
import {
  answerMockInterview,
  evaluateCompletedMockInterview,
  finishMockInterview,
  getMockInterview,
  getMockInterviewHistory,
  startMockInterview
} from '../controllers/mockInterviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { mockInterviewEvaluationRateLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.use(authenticate);

router.post('/', startMockInterview);
router.get('/', getMockInterviewHistory);
router.get('/:id', getMockInterview);
router.patch('/:id/answer', answerMockInterview);
router.post('/:id/complete', finishMockInterview);
router.post('/:id/evaluate', mockInterviewEvaluationRateLimiter, evaluateCompletedMockInterview);

export default router;
