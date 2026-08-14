import express from 'express';
import { analyzeProject } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/analyze-project', protect, analyzeProject);

export default router;
