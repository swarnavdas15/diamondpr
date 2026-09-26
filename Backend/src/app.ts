import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import clientRoutes from './modules/clients/client.routes';
import orderRoutes from './modules/orders/order.routes';
import taskRoutes from './modules/tasks/task.routes';
import calendarRoutes from './modules/calendar/calendar.routes';

const app = express();

app.use(cors());
app.use(express.json());

// API Route mounts
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', system: 'Manufacturing ERP Backend', time: new Date() });
});

export default app;
