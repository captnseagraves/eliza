import { describe, it, expect, beforeEach } from "vitest";
import { server } from "@/test/mocks/server";
import { rest } from "msw";
import { env } from "@/config/env";
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/api/events";
import { storage } from "@/lib/auth/storage";

describe("Event API Integration", () => {
  const mockToken = "mock-token";
  const mockEvent = {
    title: "Test Event",
    description: "Test Description",
    location: "Test Location",
    dateTime: new Date().toISOString(),
  };

  beforeEach(() => {
    storage.setToken(mockToken);
  });

  afterEach(() => {
    storage.clear();
  });

  describe("getEvents", () => {
    it("fetches events successfully", async () => {
      const events = await getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        title: expect.any(String),
        description: expect.any(String),
        location: expect.any(String),
      });
    });

    it("handles error response", async () => {
      server.use(
        rest.get(`${env.VITE_API_URL}/events`, (req, res, ctx) => {
          return res(ctx.status(500));
        })
      );

      await expect(getEvents()).rejects.toThrow();
    });
  });

  describe("createEvent", () => {
    it("creates event successfully", async () => {
      const event = await createEvent(mockEvent);
      expect(event).toMatchObject(mockEvent);
    });

    it("handles validation errors", async () => {
      server.use(
        rest.post(`${env.VITE_API_URL}/events`, (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              message: "Validation failed",
              errors: {
                title: ["Title is required"],
              },
            })
          );
        })
      );

      await expect(createEvent(mockEvent)).rejects.toThrow("Validation failed");
    });
  });

  describe("updateEvent", () => {
    it("updates event successfully", async () => {
      const updatedEvent = await updateEvent("1", {
        title: "Updated Title",
      });
      expect(updatedEvent.title).toBe("Updated Title");
    });
  });

  describe("deleteEvent", () => {
    it("deletes event successfully", async () => {
      await expect(deleteEvent("1")).resolves.not.toThrow();
    });

    it("handles not found error", async () => {
      server.use(
        rest.delete(`${env.VITE_API_URL}/events/999`, (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({ message: "Event not found" })
          );
        })
      );

      await expect(deleteEvent("999")).rejects.toThrow("Event not found");
    });
  });
});
