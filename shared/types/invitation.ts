import { z } from "zod";

// Phone number validation regex
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Base invitation schema for validation
export const invitationSchema = z.object({
  phoneNumber: z.string()
    .min(1, "Phone number is required")
    .regex(phoneRegex, "Invalid phone number format. Use international format: +1234567890"),
  status: z.enum(["pending", "accepted", "declined"]),
  eventId: z.string(),
});

// Schema for creating a new invitation
export const createInvitationSchema = z.object({
  phoneNumber: invitationSchema.shape.phoneNumber,
});

// Schema for updating invitation status
export const updateInvitationStatusSchema = z.object({
  status: invitationSchema.shape.status,
});

// Schema for invitation response from API
export const invitationResponseSchema = invitationSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// TypeScript types derived from schemas
export type Invitation = z.infer<typeof invitationResponseSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type UpdateInvitationStatusInput = z.infer<typeof updateInvitationStatusSchema>;
