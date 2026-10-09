import { db } from '../../prisma/db';
import { dbId } from '../../prisma/ids';

export interface CalendarEventItem {
  id: string;
  title: string;
  type: string;
  eventDate: string;
  description?: string;
  createdByName?: string;
  createdAt: string;
}

export const createCalendarEvent = async (data: {
  title: string;
  type?: string;
  eventDate: string;
  description?: string;
  createdByName?: string;
}): Promise<CalendarEventItem> => {
  const row = await db.orm.public.CalendarEvent.create({
    title: data.title,
    type: data.type || 'MEETING',
    eventDate: data.eventDate,
    description: data.description || null,
    createdByName: data.createdByName || 'System',
  });
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    eventDate: row.eventDate,
    description: row.description || undefined,
    createdByName: row.createdByName || undefined,
    createdAt: row.createdAt,
  };
};

export const listCalendarEvents = async (): Promise<CalendarEventItem[]> => {
  const rows = await db.orm.public.CalendarEvent
    .orderBy((e: { eventDate: { asc: () => any } }) => e.eventDate.asc())
    .all();

  return rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    eventDate: row.eventDate,
    description: row.description || undefined,
    createdByName: row.createdByName || undefined,
    createdAt: row.createdAt,
  }));
};

export const deleteCalendarEvent = async (id: string): Promise<boolean> => {
  try {
    await db.orm.public.CalendarEvent.where({ id: dbId(id) }).delete();
    return true;
  } catch {
    return false;
  }
};
