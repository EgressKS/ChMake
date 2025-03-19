import { Router } from 'express';
import { RemindersController } from '../controller/reminders-controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All reminder routes require authentication
router.use(authenticateToken);

/**
 * GET /api/user/reminders
 * Get all room IDs that the user has set reminders for
 */
router.get('/api/user/reminders', RemindersController.getUserReminders);

/**
 * POST /api/user/reminders/:roomId
 * Set a reminder for a specific room
 */
router.post('/api/user/reminders/:roomId', RemindersController.setReminder);

/**
 * DELETE /api/user/reminders/:roomId
 * Remove a reminder for a specific room
 */
router.delete('/api/user/reminders/:roomId', RemindersController.removeReminder);

export default router;
