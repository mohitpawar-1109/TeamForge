import express from 'express';
import {
  registerUser,
  loginUser,
  googleAuth,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
  testEmail
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/test-email', testEmail);
router.get('/me', protect, getMe);

export default router;


