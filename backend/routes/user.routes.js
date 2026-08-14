import express from 'express';
import { getUsers, getUserById, updateProfile } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getUsers);
router.put('/profile', protect, updateProfile);
router.get('/:id', getUserById);

export default router;
