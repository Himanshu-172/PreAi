import { Router } from 'express';
import { getNotes, saveNotes, updateNotes } from '../controllers/notesController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotes);
router.post('/', saveNotes);
router.patch('/:questionId', updateNotes);

export default router;
