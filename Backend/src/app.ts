import express from 'express';

// Fix BigInt serialization for Express res.json
(BigInt.prototype as any).toJSON = function () {
  return Number(this.toString());
};
import cors from 'cors';
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

const app = express();

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
  res.json({ status: 'ok', service: 'Flange ERP Backend Engine', timestamp: new Date() });
});

export default app;


