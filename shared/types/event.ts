import { z } from "zod";

// Base event schema for validation
export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().min(1, "Description is required").max(1000, "Description is too long"),
  location: z.string().min(1, "Location is required").max(200, "Location is too long"),
  dateTime: z.string().datetime("Invalid date and time"),
});

// Schema for creating a new event
export const createEventSchema = eventSchema;

// Schema for updating an existing event
export const updateEventSchema = eventSchema.partial();

// Schema for event response from API
export const eventResponseSchema = eventSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
});

// TypeScript types derived from schemas
export type Event = z.infer<typeof eventResponseSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
