import { Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { reminders, rooms } from '../shared/schema';
import { AuthRequest } from '../middleware/auth';

export class RemindersController {
  static async getUserReminders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get all roomIds that the user has set reminders for
      const userReminders = await db
        .select({
          roomId: reminders.roomId,
        })
        .from(reminders)
        .where(eq(reminders.userId, userId));

      // Return just the array of room IDs
      const roomIds = userReminders.map((reminder: { roomId: string }) => reminder.roomId);

      res.json(roomIds);
    } catch (error) {
      console.error('Get user reminders error:', error);
      res.status(500).json({
        error: 'Failed to get user reminders'
      });
    }
  }

  static async setReminder(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const roomId = req.params.roomId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if the room exists and is scheduled
      const room = await db
        .select()
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .limit(1);

      if (room.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (!room[0].scheduledDate || !room[0].scheduledTime) {
        return res.status(400).json({ error: 'Room is not scheduled' });
      }

      // Check if reminder already exists
      const existingReminder = await db
        .select()
        .from(reminders)
        .where(eq(reminders.userId, userId))
        .where(eq(reminders.roomId, roomId))
        .limit(1);

      if (existingReminder.length > 0) {
        return res.status(400).json({ error: 'Reminder already set for this room' });
      }

      // Create the reminder
      await db.insert(reminders).values({
        userId,
        roomId,
      });

      res.json({ message: 'Reminder set successfully' });
    } catch (error) {
      console.error('Set reminder error:', error);
      res.status(500).json({
        error: 'Failed to set reminder'
      });
    }
  }

  static async removeReminder(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const roomId = req.params.roomId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the reminder
      const deletedReminder = await db
        .delete(reminders)
        .where(eq(reminders.userId, userId))
        .where(eq(reminders.roomId, roomId))
        .returning();

      if (deletedReminder.length === 0) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      res.json({ message: 'Reminder removed successfully' });
    } catch (error) {
      console.error('Remove reminder error:', error);
      res.status(500).json({
        error: 'Failed to remove reminder'
      });
    }
  }
}
