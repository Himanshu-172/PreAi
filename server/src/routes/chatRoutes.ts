import { Router } from 'express';
import {
  createChatMessage,
  getChatConversation,
  getChatHistory,
  removeChatConversation,
  renameChat
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/', createChatMessage);
router.get('/', getChatHistory);
router.get('/:id', getChatConversation);
router.patch('/:id', renameChat);
router.delete('/:id', removeChatConversation);

export default router;
