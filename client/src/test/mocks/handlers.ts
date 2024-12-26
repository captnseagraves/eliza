import { rest } from "msw";
import { env } from "@/config/env";

const API_URL = env.VITE_API_URL;

export const handlers = [
  // Auth handlers
  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: "Verification code sent",
      })
    );
  }),

  rest.post(`${API_URL}/auth/verify`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: "mock-token",
        user: {
          id: "1",
          phoneNumber: "+1234567890",
        },
      })
    );
  }),

  // Event handlers
  rest.get(`${API_URL}/events`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: "1",
          title: "Test Event",
          description: "Test Description",
          location: "Test Location",
          dateTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "1",
        },
      ])
    );
  }),

  rest.get(`${API_URL}/events/:id`, (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id,
        title: "Test Event",
        description: "Test Description",
        location: "Test Location",
        dateTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "1",
      })
    );
  }),

  // Invitation handlers
  rest.get(`${API_URL}/events/:eventId/invites`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: "1",
          eventId: req.params.eventId,
          phoneNumber: "+1234567890",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    );
  }),

  rest.post(`${API_URL}/events/:eventId/invites`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: "1",
        eventId: req.params.eventId,
        phoneNumber: "+1234567890",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  }),
];
