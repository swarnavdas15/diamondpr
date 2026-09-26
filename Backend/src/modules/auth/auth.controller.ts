import { Request, Response } from 'express';
import {
  loginUser,
  requestPasswordResetOtp,
  verifyOtpCode,
  resetUserPassword,
} from './auth.service';

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { identifier, email, username, password } = req.body;
    const loginKey = identifier || email || username;

    if (!loginKey || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const result = await loginUser(loginKey, password);
    return res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Authentication failed' });
  }
};

export const forgotPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { identifier, username, email } = req.body;
    const key = identifier || username || email;

    if (!key) {
      return res.status(400).json({ error: 'Username or registered email address is required' });
    }

    const result = await requestPasswordResetOtp(key);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to process OTP request' });
  }
};

export const verifyOtpHandler = async (req: Request, res: Response) => {
  try {
    const { identifier, username, email, otpCode } = req.body;
    const key = identifier || username || email;

    if (!key || !otpCode) {
      return res.status(400).json({ error: 'Username/Email and OTP code are required' });
    }

    const result = await verifyOtpCode(key, otpCode);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'OTP verification failed' });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { identifier, username, email, resetToken, newPassword } = req.body;
    const key = identifier || username || email;

    if (!key || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'User ID, reset token, and new password are required' });
    }

    const result = await resetUserPassword(key, resetToken, newPassword);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Password reset failed' });
  }
};