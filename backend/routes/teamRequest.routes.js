import express from 'express';
import {
  getTeamRequests,
  updateTeamRequestStatus
} from '../controllers/teamRequest.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getTeamRequests);

router.route('/:id')
  .patch(protect, updateTeamRequestStatus);

export default router;
