export interface CalendarEventItem {
  id: string;
  title: string;
  type: string;
  eventDate: string;
  description?: string;
  createdById: string;
  createdAt: string;
}

const eventsStore: CalendarEventItem[] = [];

export const createCalendarEvent = async (data: {
  title: string;
  type?: string;
  eventDate: Date | string;
  description?: string;
  createdById: string;
}): Promise<CalendarEventItem> => {
  const eventItem: CalendarEventItem = {
    id: `cal-${Date.now()}`,
    title: data.title,
    type: data.type || 'MEETING',
    eventDate: typeof data.eventDate === 'string' ? data.eventDate : data.eventDate.toISOString(),
    description: data.description,
    createdById: data.createdById,
    createdAt: new Date().toISOString(),
  };
  eventsStore.push(eventItem);
  return eventItem;
};

export const listCalendarEvents = async (): Promise<CalendarEventItem[]> => {
  return [...eventsStore].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
};

export const deleteCalendarEvent = async (id: string): Promise<boolean> => {
  const idx = eventsStore.findIndex((e) => e.id === id);
  if (idx !== -1) {
    eventsStore.splice(idx, 1);
    return true;
  }
  return false;
};
