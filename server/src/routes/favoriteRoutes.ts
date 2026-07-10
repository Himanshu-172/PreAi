import { Router } from 'express';
import { deleteFavorite, getFavorites, saveFavorite } from '../controllers/favoritesController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getFavorites);
router.post('/', saveFavorite);
router.delete('/:questionId', deleteFavorite);

export default router;
