import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Event-specific invitations
router.post('/events/:eventId/invites', InvitationController.createInvitation);
router.get('/events/:eventId/invites', InvitationController.listEventInvitations);

// User invitations
router.get('/user/invites', InvitationController.listUserInvitations);

// Individual invitation operations
router.get('/invites/:id', InvitationController.getInvitation);
router.get('/invites/link/:inviteLinkId', InvitationController.getInvitationByLink);
router.put('/invites/:id/status', InvitationController.updateInvitationStatus);

export default router;
