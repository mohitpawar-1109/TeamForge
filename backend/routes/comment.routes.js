import express from 'express';
import {
  updateComment,
  deleteComment
} from '../controllers/comment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/:id')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

export default router;
