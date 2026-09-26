import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Replace ZodSchema with z.ZodTypeAny
export const validate = (schema: z.ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body against Zod schema
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(500).json({ success: false, message: 'Internal validation error' });
    }
  };
};