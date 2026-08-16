import express from 'express';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  joinTeamPost,
  getPostMatches
} from '../controllers/post.controller.js';
import {
  getPostComments,
  createComment
} from '../controllers/comment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getPosts)
  .post(protect, createPost);

router.get('/:id/matches', protect, getPostMatches);

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.route('/:id/like')
  .post(protect, likePost)
  .delete(protect, unlikePost);

router.route('/:id/comments')
  .get(getPostComments)
  .post(protect, createComment);

router.post('/:id/join', protect, joinTeamPost);

export default router;
