import { Router } from 'express';
import {
  loginHandler,
  forgotPasswordHandler,
  verifyOtpHandler,
  resetPasswordHandler,
} from './auth.controller';

const router = Router();

router.post('/login', loginHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/verify-otp', verifyOtpHandler);
router.post('/reset-password', resetPasswordHandler);

export default router;