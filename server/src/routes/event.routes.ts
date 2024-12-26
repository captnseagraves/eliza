import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All event routes require authentication
router.use(authenticateToken);

// Event CRUD operations
router.post('/', EventController.createEvent);
router.get('/', EventController.listEvents);
router.get('/search', EventController.searchEvents);
router.get('/:id', EventController.getEvent);
router.put('/:id', EventController.updateEvent);
router.delete('/:id', EventController.deleteEvent);

export default router;
