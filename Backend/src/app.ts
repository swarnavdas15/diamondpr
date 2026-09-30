import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { MulterError } from 'multer';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import clientRoutes from './modules/clients/client.routes';
import orderRoutes from './modules/orders/order.routes';
import adminRoutes from './modules/admin/admin.routes';
import taskRoutes from './modules/tasks/task.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import drawingRoutes from './modules/drawings/drawing.routes';
import quotationRoutes from './modules/quotations/quotation.routes';
import vendorRoutes from './modules/vendors/vendor.routes';
import { initHealthCron, getHealthStats } from './services/healthCron.service';

const app = express();

// Initialize 14-minute background health counter cron job
initHealthCron();

// Fix BigInt serialization for JSON responses
(BigInt.prototype as any).toJSON = function () {
  const intVal = Number(this);
  return Number.isSafeInteger(intVal) ? intVal : this.toString();
};

app.use(cors());
app.use(express.json());

// Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/drawings', drawingRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/vendors', vendorRoutes);

app.get('/health', (req, res) => {
  const stats = getHealthStats();
  res.json({
    status: 'ok',
    service: 'Flange ERP Backend Engine',
    timestamp: new Date(),
    healthCounter: stats.healthPingCount,
    lastHealthCheckTime: stats.lastHealthCheckTime,
    uptimeSeconds: stats.uptimeSeconds,
  });
});

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
});

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);

  // Handle MulterError instances (file size, field count, etc.) with 400 status
  if (err instanceof MulterError) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }

  // Handle multer file filter errors (error.message contains 'Unsupported') with 422 status
  if (err.message && (err.message.includes('Unsupported') || err.message.includes('Only Excel files'))) {
    return res.status(422).json({
      success: false,
      error: err.message,
      code: 'UNSUPPORTED_FILE_TYPE'
    });
  }

  // Handle all other errors with 500 status
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : (typeof err.status === 'number' ? err.status : 500);
  const errorMessage = isProduction && statusCode === 500 ? 'Internal server error' : (err.message || 'Internal server error');

  const response: {
    success: boolean;
    error: string;
    code?: string;
    stack?: string;
  } = {
    success: false,
    error: errorMessage
  };

  if (err.code && typeof err.code === 'string') {
    response.code = err.code;
  }

  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
});

export default app;
