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

import {
  uploadMedia,
  validateMediaFiles,
  handleUploadError
} from '../middleware/upload.middleware.js';

const router = express.Router();


// ============================================
// COMMUNITY POSTS
// ============================================

router.route('/')
  .get(getPosts)
  .post(
    protect,
    uploadMedia,
    handleUploadError,
    validateMediaFiles,
    createPost
  );


// ============================================
// AI / TEAM MATCHES
// ============================================

router.get(
  '/:id/matches',
  protect,
  getPostMatches
);


// ============================================
// SINGLE POST
// ============================================

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);


// ============================================
// LIKES
// ============================================

router.route('/:id/like')
  .post(protect, likePost)
  .delete(protect, unlikePost);


// ============================================
// COMMENTS
// ============================================

router.route('/:id/comments')
  .get(getPostComments)
  .post(protect, createComment);


// ============================================
// JOIN TEAM
// ============================================

router.post(
  '/:id/join',
  protect,
  joinTeamPost
);

export default router;