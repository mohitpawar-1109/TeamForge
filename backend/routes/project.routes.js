import express from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject, leaveTeam } from '../controllers/project.controller.js';
import {
  sendMentorMessage,
  getMentorHistory,
  clearMentorHistory,
  getPrompts
} from '../controllers/mentor.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Optional user attachment for match scores
router.get('/', async (req, res, next) => {
  // Try protect if token exists, else continue
  if (req.headers.authorization) {
    return protect(req, res, () => getProjects(req, res, next));
  }
  return getProjects(req, res, next);
});

router.post('/', protect, createProject);
router.get('/:id', async (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, () => getProjectById(req, res, next));
  }
  return getProjectById(req, res, next);
});

router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/team/leave', protect, leaveTeam);

// AI Project Mentor Endpoints
router.post('/:id/ai-mentor/chat', protect, sendMentorMessage);
router.get('/:id/ai-mentor/history', protect, getMentorHistory);
router.delete('/:id/ai-mentor/history', protect, clearMentorHistory);
router.get('/:id/ai-mentor/prompts', protect, getPrompts);

export default router;

