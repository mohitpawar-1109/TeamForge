import express from 'express';
import { getProjectTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/projects/:projectId/tasks', protect, getProjectTasks);
router.post('/projects/:projectId/tasks', protect, createTask);
router.put('/tasks/:id', protect, updateTask);
router.delete('/tasks/:id', protect, deleteTask);

export default router;
