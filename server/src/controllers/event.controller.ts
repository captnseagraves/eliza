import { Response } from 'express';
import { EventService, EventFilters } from '../services/event.service';
import { AuthRequest } from '../types/auth';

export class EventController {
  static async createEvent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { title, description, dateTime, location, imageUrl } = req.body;

      // Validate required fields
      if (!title || !description || !dateTime || !location) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const event = await EventService.createEvent({
        title,
        description,
        dateTime: new Date(dateTime),
        location,
        imageUrl,
        creator: {
          connect: { id: userId },
        },
      });

      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }

  static async getEvent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const event = await EventService.getEvent(id);

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(event);
    } catch (error) {
      console.error('Error getting event:', error);
      res.status(500).json({ error: 'Failed to get event' });
    }
  }

  static async updateEvent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Validate at least one field is being updated
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No update data provided' });
      }

      const event = await EventService.updateEvent(id, userId, updateData);
      res.json(event);
    } catch (error) {
      if (error instanceof Error && error.message === 'Event not found or user not authorized') {
        res.status(403).json({ error: error.message });
      } else {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
      }
    }
  }

  static async deleteEvent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      await EventService.deleteEvent(id, userId);
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      if (error instanceof Error && error.message === 'Event not found or user not authorized') {
        res.status(403).json({ error: error.message });
      } else {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
      }
    }
  }

  static async listEvents(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const filters: EventFilters = {};

      // Parse query parameters
      if (req.query.search) {
        filters.search = req.query.search as string;
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      if (req.query.createdByMe === 'true') {
        filters.createdByMe = true;
      }
      if (req.query.attending === 'true') {
        filters.attending = true;
      }

      const events = await EventService.listEvents(userId, filters);
      res.json(events);
    } catch (error) {
      console.error('Error listing events:', error);
      res.status(500).json({ error: 'Failed to list events' });
    }
  }

  static async searchEvents(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const events = await EventService.searchEvents(userId, query);
      res.json(events);
    } catch (error) {
      console.error('Error searching events:', error);
      res.status(500).json({ error: 'Failed to search events' });
    }
  }
}
