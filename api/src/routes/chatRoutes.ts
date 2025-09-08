import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const chatController = new ChatController();

// Apply rate limiting to chat endpoints
router.use(rateLimiter);

router.post('/message', chatController.chat);
router.post('/generate-template', chatController.generateTemplate);
router.post('/stream', chatController.streamChat);

export default router;
