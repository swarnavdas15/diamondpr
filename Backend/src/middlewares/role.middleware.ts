import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Authentication required', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this resource. Required: ${allowedRoles.join(', ')}`,
        message: 'Permission denied: You do not have the required role to access this resource.',
      });
    }

    next();
  };
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user?.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
        message: 'Permission denied: You do not have the required role to access this resource.',
      });
    }
    next();
  };
};
