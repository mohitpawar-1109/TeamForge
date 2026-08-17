import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  inviteMembers,
  removeMember,
  updateMemberRole,
  getOrCreateDM,
  getProjectGroup
} from '../controllers/group.controller.js';

const router = express.Router();

// All group routes are protected
router.use(protect);

router.post('/', createGroup);
router.get('/', getGroups);
router.post('/dm', getOrCreateDM);
router.get('/project/:projectId', getProjectGroup);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.post('/:id/invite', inviteMembers);
router.delete('/:id/members/:userId', removeMember);
router.patch('/:id/members/:userId/role', updateMemberRole);

export default router;
