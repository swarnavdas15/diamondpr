import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { sendOtpEmail } from '../../utils/mailer';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// In-memory secure hashed OTP store: email -> { hashedOtp, expiresAt, resetToken }
interface OtpRecord {
  hashedOtp: string;
  expiresAt: number;
  requests: number;
  resetToken?: string;
  resetTokenExpiresAt?: number;
}

const otpStore = new Map<string, OtpRecord>();

export const loginUser = async (identifier: string, pass: string) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    throw new Error('Your account has been deactivated by Super Admin. Please contact administrator.');
  }

  const isMatch = await bcrypt.compare(pass, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, name: user.name, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    token,
  };
};

export const requestPasswordResetOtp = async (identifier: string) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw new Error(`No account found for User ID or Email: '${identifier}'`);
  }

  const email = user.email.toLowerCase();
  const existing = otpStore.get(email);

  // Rate Limiting Security Check
  if (existing && existing.requests >= 4 && Date.now() < existing.expiresAt) {
    throw new Error('Too many OTP requests. Please wait 5 minutes before trying again.');
  }

  // Generate random 6-digit OTP
  const rawOtp = String(Math.floor(100000 + Math.random() * 900000));
  const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 Minutes Expiration

  otpStore.set(email, {
    hashedOtp,
    expiresAt,
    requests: (existing?.requests || 0) + 1,
  });

  // Dispatch REAL Email to user inbox (amarchattaraj@gmail.com)
  await sendOtpEmail(user.email, rawOtp, user.name);

  // Mask email for UI response: amarchattaraj@gmail.com -> a***j@gmail.com
  const parts = user.email.split('@');
  const maskedLocal = parts[0].length > 2 ? `${parts[0][0]}***${parts[0][parts[0].length - 1]}` : parts[0];
  const maskedEmail = `${maskedLocal}@${parts[1]}`;

  // SECURITY RULE: Never return raw OTP in API response or UI!
  return {
    message: 'OTP verification code has been delivered to your registered email inbox.',
    email: user.email,
    maskedEmail,
  };
};

export const verifyOtpCode = async (identifier: string, inputOtp: string) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw new Error('User account not found.');
  }

  const email = user.email.toLowerCase();
  const record = otpStore.get(email);

  if (!record) {
    throw new Error('No OTP request found for this account. Please request a new OTP.');
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    throw new Error('OTP code has expired. Please request a new OTP.');
  }

  const hashedInput = crypto.createHash('sha256').update(inputOtp.trim()).digest('hex');
  if (hashedInput !== record.hashedOtp) {
    throw new Error('Invalid OTP code. Please check your email inbox and enter the correct code.');
  }

  // Generate single-use reset token valid for 10 minutes
  const resetToken = jwt.sign({ userId: user.id, email: user.email, purpose: 'RESET_PASSWORD' }, JWT_SECRET, {
    expiresIn: '10m',
  });

  record.resetToken = resetToken;
  record.resetTokenExpiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, record);

  return { message: 'OTP successfully verified', resetToken, email: user.email };
};

export const resetUserPassword = async (identifier: string, resetToken: string, newPass: string) => {
  if (!newPass || newPass.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  try {
    const decoded = jwt.verify(resetToken, JWT_SECRET) as any;
    if (decoded.purpose !== 'RESET_PASSWORD') throw new Error('Invalid reset token');
  } catch (err) {
    throw new Error('Reset token is invalid or expired. Please request a new OTP.');
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw new Error('User account not found.');
  }

  const hashedPassword = await bcrypt.hash(newPass, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  // Consume OTP and Reset Token (single-use)
  otpStore.delete(user.email.toLowerCase());

  return { message: 'Password successfully reset. You may now log in with your new password.' };
};