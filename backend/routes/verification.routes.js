import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import {
  startSkillTest,
  submitSkillTest,
  getSkillResults,
  getUserSkillVerifications,
  submitProjectFeedback,
  getProjectFeedback,
  submitUserFeedback,
  getUserFeedback,
  getUserTrustScore,
  getProjectCredibilityReport,
  generateOnboardingAssessment,
  submitOnboardingAssessment,
  getOnboardingAssessmentResult
} from '../controllers/verification.controller.js';

const router = express.Router();

// Onboarding & Registration AI-Generated Assessment
router.post('/skill-assessment/generate', optionalAuth, generateOnboardingAssessment);
router.post('/skill-assessment/:assessmentId/submit', optionalAuth, submitOnboardingAssessment);
router.get('/skill-assessment/:assessmentId/result', getOnboardingAssessmentResult);

// Skill Assessment & Verification (Profile Hub)
router.post('/skills/:skillName/start-test', protect, startSkillTest);
router.post('/skills/:skillName/submit-test', protect, submitSkillTest);
router.get('/skills/:skillName/results', protect, getSkillResults);
router.get('/users/:userId/skill-verifications', protect, getUserSkillVerifications);

// User Trust & Peer Feedback
router.post('/users/:userId/feedback', protect, submitUserFeedback);
router.get('/users/:userId/feedback', protect, getUserFeedback);
router.get('/users/:userId/trust-score', protect, getUserTrustScore);

// Project Feedback & Credibility
router.post('/projects/:projectId/feedback', protect, submitProjectFeedback);
router.get('/projects/:projectId/feedback', protect, getProjectFeedback);
router.get('/projects/:projectId/credibility', protect, getProjectCredibilityReport);

export default router;

