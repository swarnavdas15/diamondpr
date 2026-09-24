import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Permission denied: You do not have the required role to access this resource.' 
      });
    }
    next();
  };
};