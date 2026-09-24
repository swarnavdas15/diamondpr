import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import orderRoutes from './modules/orders/order.routes';
import adminRoutes from './modules/admin/admin.routes';
import taskRoutes from './modules/tasks/task.routes';
import drawingRoutes from './modules/drawings/drawing.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/drawings', drawingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Flange ERP Backend Engine', timestamp: new Date() });
});

export default app;