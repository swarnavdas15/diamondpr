import { Request, Response } from 'express';
import { loginUser } from './auth.service';

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await loginUser(email, password);
    return res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Authentication failed' });
  }
};