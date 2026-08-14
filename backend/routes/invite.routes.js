import express from 'express';
import { createInvitation, getInvitations, updateInvitationStatus } from '../controllers/invite.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createInvitation);
router.get('/', protect, getInvitations);
router.patch('/:id', protect, updateInvitationStatus);

export default router;
