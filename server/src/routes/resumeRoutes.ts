import { Router } from 'express';
import { analyzeResume, getResumeAnalysis, getResumeHistory, uploadResume } from '../controllers/resumeController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { uploadResumePdf } from '../middleware/resumeUploadMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadResumePdf, uploadResume);
router.get('/history', getResumeHistory);
router.post('/:id/analyze', analyzeResume);
router.get('/:id', getResumeAnalysis);

export default router;
