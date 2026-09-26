import { PrismaClient, CalendarEventType } from '@prisma/client';

const prisma = new PrismaClient();

export const createCalendarEvent = async (data: {
  title: string;
  type?: CalendarEventType;
  eventDate: Date;
  description?: string;
  createdById: string;
}) => {
  return prisma.calendarEvent.create({
    data: {
      title: data.title,
      type: data.type || CalendarEventType.MEETING,
      eventDate: data.eventDate,
      description: data.description,
      createdById: data.createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });
};

export const listCalendarEvents = async () => {
  return prisma.calendarEvent.findMany({
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
    },
    orderBy: { eventDate: 'asc' },
  });
};

export const deleteCalendarEvent = async (id: string) => {
  return prisma.calendarEvent.delete({
    where: { id },
  });
};
