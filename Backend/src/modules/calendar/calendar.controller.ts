import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as calendarService from './calendar.service';

export const handleCreateCalendarEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, type, eventDate, description } = req.body;
    if (!title || !eventDate) {
      return res.status(400).json({ error: 'Title and event date are required' });
    }

    const createdByName = req.user?.name || 'System';
    const event = await calendarService.createCalendarEvent({
      title,
      type,
      eventDate: typeof eventDate === 'string' ? eventDate : new Date(eventDate).toISOString(),
      description,
      createdByName,
    });

    return res.status(201).json({ message: 'Calendar event created', event });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create calendar event' });
  }
};

export const handleListCalendarEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await calendarService.listCalendarEvents();
    return res.status(200).json({ events });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch calendar events' });
  }
};

export const handleDeleteCalendarEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await calendarService.deleteCalendarEvent(id as string);
    return res.status(200).json({ message: 'Calendar event deleted' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to delete calendar event' });
  }
};
