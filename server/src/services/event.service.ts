import prisma from '../config/database';
import { Event, Prisma } from '@prisma/client';

export interface EventFilters {
  search?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  createdByMe?: boolean;
  attending?: boolean;
}

export class EventService {
  static async createEvent(data: Prisma.EventCreateInput): Promise<Event> {
    return prisma.event.create({
      data,
      include: {
        creator: true,
      },
    });
  }

  static async getEvent(id: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { id },
      include: {
        creator: true,
        userEvents: {
          include: {
            user: true,
          },
        },
        invitations: true,
      },
    });
  }

  static async updateEvent(id: string, creatorId: string, data: Partial<Event>): Promise<Event> {
    // First verify the user is the creator
    const event = await prisma.event.findFirst({
      where: {
        id,
        creatorId,
      },
    });

    if (!event) {
      throw new Error('Event not found or user not authorized');
    }

    // Remove fields that shouldn't be updated
    const { id: eventId, createdAt, creatorId: creator, ...updateData } = data;

    return prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        creator: true,
      },
    });
  }

  static async deleteEvent(id: string, creatorId: string): Promise<Event> {
    // First verify the user is the creator
    const event = await prisma.event.findFirst({
      where: {
        id,
        creatorId,
      },
    });

    if (!event) {
      throw new Error('Event not found or user not authorized');
    }

    // Delete related records first
    await prisma.$transaction([
      prisma.eventChat.deleteMany({ where: { eventId: id } }),
      prisma.invitation.deleteMany({ where: { eventId: id } }),
      prisma.userEvent.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);

    return event;
  }

  static async listEvents(userId: string, filters?: EventFilters): Promise<Event[]> {
    const where: Prisma.EventWhereInput = {
      OR: [],
    };

    // Base conditions based on user relationship
    const baseConditions: Prisma.EventWhereInput[] = [];
    
    if (!filters?.createdByMe && !filters?.attending) {
      // Default behavior: show both created and attending events
      baseConditions.push(
        { creatorId: userId },
        {
          userEvents: {
            some: {
              userId,
              status: 'attending',
            },
          },
        }
      );
    } else {
      if (filters.createdByMe) {
        baseConditions.push({ creatorId: userId });
      }
      if (filters.attending) {
        baseConditions.push({
          userEvents: {
            some: {
              userId,
              status: 'attending',
            },
          },
        });
      }
    }

    where.OR = baseConditions;

    // Add search filter
    if (filters?.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { location: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Add date range filter
    if (filters?.startDate || filters?.endDate) {
      where.AND = where.AND || [];
      where.AND.push({
        dateTime: {
          ...(filters.startDate && { gte: filters.startDate }),
          ...(filters.endDate && { lte: filters.endDate }),
        },
      });
    }

    // Add status filter
    if (filters?.status) {
      where.AND = where.AND || [];
      where.AND.push({ status: filters.status });
    }

    return prisma.event.findMany({
      where,
      include: {
        creator: true,
        userEvents: {
          include: {
            user: true,
          },
        },
        invitations: true,
      },
      orderBy: {
        dateTime: 'asc',
      },
    });
  }

  static async searchEvents(userId: string, query: string): Promise<Event[]> {
    return this.listEvents(userId, { search: query });
  }
}
