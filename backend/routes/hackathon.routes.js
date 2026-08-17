import express from 'express';
import {
  getHackathons,
  getHackathonById,
  toggleSaveHackathon,
  toggleInterestHackathon,
  createHackathon
} from '../controllers/hackathon.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Optional user attachment for skill matching calculations
const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

router.get('/', optionalProtect, getHackathons);
router.post('/', protect, createHackathon);
router.get('/:id', optionalProtect, getHackathonById);
router.post('/:id/save', protect, toggleSaveHackathon);
router.post('/:id/interested', protect, toggleInterestHackathon);

export default router;
