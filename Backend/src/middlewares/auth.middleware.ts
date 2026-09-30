import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../prisma/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    name?: string;
    username?: string;
    clientDataVisibility?: 'FULL' | 'CODE_ONLY';
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required', message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;

    // Dynamically fetch latest user permissions & visibility setting from DB for real-time updates
    if (decoded?.userId) {
      try {
        const userRecord = await db.orm.public.User.where({ id: decoded.userId }).first();
        if (userRecord) {
          req.user = {
            ...decoded,
            role: userRecord.role || decoded.role,
            clientDataVisibility: userRecord.clientDataVisibility || decoded.clientDataVisibility,
          };
        }
      } catch (dbErr) {
        // Fallback to decoded token if DB query encounters transient error
      }
    }

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token', message: 'Invalid or expired token' });
  }
};
