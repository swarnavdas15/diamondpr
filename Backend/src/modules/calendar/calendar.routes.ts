import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import {
  handleCreateCalendarEvent,
  handleListCalendarEvents,
  handleDeleteCalendarEvent,
} from './calendar.controller';

const router = Router();

router.get('/', authenticateToken, handleListCalendarEvents);
router.post('/', authenticateToken, handleCreateCalendarEvent);
router.delete('/:id', authenticateToken, handleDeleteCalendarEvent);

export default router;
