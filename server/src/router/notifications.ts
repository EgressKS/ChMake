import { Router } from 'express';
import { NotificationController } from '../controller/notification-controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/mark-read', NotificationController.markAsRead);
router.patch('/mark-all-read', NotificationController.markAllAsRead);
router.delete('/:id', NotificationController.deleteNotification);

// Admin only: create notifications
router.post('/create', NotificationController.createNotification);

export default router;
