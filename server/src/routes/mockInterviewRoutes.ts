import { Router } from 'express';
import {
  answerMockInterview,
  finishMockInterview,
  getMockInterview,
  getMockInterviewHistory,
  startMockInterview
} from '../controllers/mockInterviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/', startMockInterview);
router.get('/', getMockInterviewHistory);
router.get('/:id', getMockInterview);
router.patch('/:id/answer', answerMockInterview);
router.post('/:id/complete', finishMockInterview);

export default router;
