import { Response } from 'express';
import { InvitationService } from '../services/invitation.service';
import { AuthRequest } from '../types/auth';

export class InvitationController {
  static async createInvitation(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { eventId } = req.params;
      const { phoneNumber, customMessage } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      const invitation = await InvitationService.createInvitation({
        eventId,
        phoneNumber,
        customMessage,
        creatorId: userId,
      });

      res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Event not found or user not authorized') {
          return res.status(403).json({ error: error.message });
        }
        if (error.message === 'Invitation already exists for this phone number') {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Error creating invitation:', error);
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  }

  static async getInvitation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const invitation = await InvitationService.getInvitation(id);

      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      res.json(invitation);
    } catch (error) {
      console.error('Error getting invitation:', error);
      res.status(500).json({ error: 'Failed to get invitation' });
    }
  }

  static async getInvitationByLink(req: AuthRequest, res: Response) {
    try {
      const { inviteLinkId } = req.params;
      const invitation = await InvitationService.getInvitationByLink(inviteLinkId);

      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      res.json(invitation);
    } catch (error) {
      console.error('Error getting invitation:', error);
      res.status(500).json({ error: 'Failed to get invitation' });
    }
  }

  static async updateInvitationStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const invitation = await InvitationService.updateInvitationStatus(
        id,
        userId,
        status as 'accepted' | 'declined'
      );

      res.json(invitation);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invitation not found or user not authorized') {
        return res.status(403).json({ error: error.message });
      }
      console.error('Error updating invitation status:', error);
      res.status(500).json({ error: 'Failed to update invitation status' });
    }
  }

  static async listEventInvitations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { eventId } = req.params;
      const invitations = await InvitationService.listInvitations(eventId, userId);

      res.json(invitations);
    } catch (error) {
      if (error instanceof Error && error.message === 'Event not found or user not authorized') {
        return res.status(403).json({ error: error.message });
      }
      console.error('Error listing invitations:', error);
      res.status(500).json({ error: 'Failed to list invitations' });
    }
  }

  static async listUserInvitations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const invitations = await InvitationService.getUserInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error('Error listing user invitations:', error);
      res.status(500).json({ error: 'Failed to list user invitations' });
    }
  }
}
