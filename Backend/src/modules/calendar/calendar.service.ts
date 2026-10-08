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

const calendarEventModel = () => (db.orm.public as any).CalendarEvent;

export const createCalendarEvent = async (data: {
  title: string;
  type?: string;
  eventDate: string;
  description?: string;
  createdByName?: string;
}): Promise<CalendarEventItem> => {
  const row = await calendarEventModel().create({
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
  const rows = await calendarEventModel()
    .orderBy((e: any) => e.eventDate.asc())
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
    await calendarEventModel().where({ id: dbId(id) }).delete();
    return true;
  } catch {
    return false;
  }
};
