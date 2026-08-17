import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getRoomMessages,
  sendRoomMessage,
  markRoomMessagesRead
} from '../controllers/message.controller.js';

const router = express.Router();

router.use(protect);

router.get('/:roomId', getRoomMessages);
router.post('/:roomId', sendRoomMessage);
router.patch('/:roomId/read', markRoomMessagesRead);

export default router;
