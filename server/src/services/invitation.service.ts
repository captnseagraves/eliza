import prisma from '../config/database';
import { Invitation, Prisma } from '@prisma/client';
import crypto from 'crypto';

export class InvitationService {
  static generateInviteLink(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  static async createInvitation(data: {
    eventId: string;
    phoneNumber: string;
    customMessage?: string;
    creatorId: string;
  }): Promise<Invitation> {
    const { eventId, phoneNumber, customMessage, creatorId } = data;

    // Verify the event exists and user is the creator
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        creatorId,
      },
    });

    if (!event) {
      throw new Error('Event not found or user not authorized');
    }

    // Check if an invitation already exists for this phone number
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        eventId,
        phoneNumber,
      },
    });

    if (existingInvitation) {
      throw new Error('Invitation already exists for this phone number');
    }

    // Find or create user for this phone number
    const user = await prisma.user.upsert({
      where: { phoneNumber },
      create: {
        phoneNumber,
        invitedEvents: [eventId],
      },
      update: {
        invitedEvents: {
          push: eventId,
        },
      },
    });

    return prisma.invitation.create({
      data: {
        event: { connect: { id: eventId } },
        user: { connect: { id: user.id } },
        phoneNumber,
        customMessage,
        inviteLinkId: this.generateInviteLink(),
      },
      include: {
        event: true,
        user: true,
      },
    });
  }

  static async getInvitation(id: string): Promise<Invitation | null> {
    return prisma.invitation.findUnique({
      where: { id },
      include: {
        event: true,
        user: true,
      },
    });
  }

  static async getInvitationByLink(inviteLinkId: string): Promise<Invitation | null> {
    return prisma.invitation.findFirst({
      where: { inviteLinkId },
      include: {
        event: true,
        user: true,
      },
    });
  }

  static async updateInvitationStatus(
    id: string,
    userId: string,
    status: 'accepted' | 'declined'
  ): Promise<Invitation> {
    const invitation = await prisma.invitation.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        event: true,
      },
    });

    if (!invitation) {
      throw new Error('Invitation not found or user not authorized');
    }

    // Start a transaction to update both invitation and user
    return prisma.$transaction(async (tx) => {
      const updatedInvitation = await tx.invitation.update({
        where: { id },
        data: { status },
        include: {
          event: true,
          user: true,
        },
      });

      // Update user's accepted events array if accepting
      if (status === 'accepted') {
        await tx.user.update({
          where: { id: userId },
          data: {
            acceptedEvents: {
              push: invitation.eventId,
            },
          },
        });

        // Create UserEvent record
        await tx.userEvent.create({
          data: {
            user: { connect: { id: userId } },
            event: { connect: { id: invitation.eventId } },
            status: 'attending',
          },
        });
      }

      return updatedInvitation;
    });
  }

  static async listInvitations(eventId: string, creatorId: string): Promise<Invitation[]> {
    // Verify the event exists and user is the creator
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        creatorId,
      },
    });

    if (!event) {
      throw new Error('Event not found or user not authorized');
    }

    return prisma.invitation.findMany({
      where: { eventId },
      include: {
        event: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getUserInvitations(userId: string): Promise<Invitation[]> {
    return prisma.invitation.findMany({
      where: { userId },
      include: {
        event: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
