import { Response } from 'express';
import { db } from '../lib/db';
import { notifications, users } from '../shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit = 20, offset = 0 } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notificationList = await db
        .select({
          id: notifications.id,
          userId: notifications.userId,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          isRead: notifications.isRead,
          data: notifications.data,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      res.json(notificationList);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        error: 'Failed to get notifications'
      });
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(sql`${notifications.userId} = ${userId} AND ${notifications.isRead} = false`);

      res.json({ unreadCount: result[0]?.count || 0 });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        error: 'Failed to get unread count'
      });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { ids } = req.body; // Array of notification IDs to mark as read

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'Notification IDs array is required' });
      }

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(sql`${notifications.userId} = ${userId} AND ${notifications.id} IN (${ids.map(id => `'${id}'`).join(',')})`);

      res.json({ message: 'Notifications marked as read' });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        error: 'Failed to mark notifications as read'
      });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        error: 'Failed to mark all notifications as read'
      });
    }
  }

  static async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const deletedNotification = await db
        .delete(notifications)
        .where(sql`${notifications.id} = ${id} AND ${notifications.userId} = ${userId}`)
        .returning();

      if (deletedNotification.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        error: 'Failed to delete notification'
      });
    }
  }

  static async createNotification(req: AuthRequest, res: Response) {
    try {
      const { userId, type, title, message, data } = req.body;

      if (!userId || !type || !title || !message) {
        return res.status(400).json({ error: 'userId, type, title, and message are required' });
      }

      const newNotification = await db.insert(notifications).values({
        userId,
        type,
        title,
        message,
        data,
      }).returning();

      res.status(201).json(newNotification[0]);
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({
        error: 'Failed to create notification'
      });
    }
  }
}
