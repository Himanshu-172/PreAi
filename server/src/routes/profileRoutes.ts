import { Router } from 'express';
import { getUserProfile, updateUserPassword, updateUserProfile } from '../controllers/profileController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getUserProfile);
router.patch('/', updateUserProfile);
router.patch('/password', updateUserPassword);

export default router;
