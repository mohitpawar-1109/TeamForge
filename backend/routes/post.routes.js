import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost
} from '../controllers/post.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getPosts)
  .post(protect, createPost);

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.post('/:id/like', protect, toggleLikePost);

export default router;
