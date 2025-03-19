import { Response } from 'express';
import { db } from '../lib/db';
import { rooms, participants, users, messages } from '../shared/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { insertRoomSchema } from '../shared/schema';
import { AuthRequest } from '../middleware/auth';
import { broadcastToRoom } from '../index';

export class RoomController {
  static async createRoom(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, language, topic, maxParticipants, scheduledDate, scheduledTime } = insertRoomSchema.parse(req.body);

      // Parse scheduledDate string to Date if provided
      let parsedScheduledDate: Date | undefined;
      if (scheduledDate) {
        parsedScheduledDate = new Date(scheduledDate);
        if (isNaN(parsedScheduledDate.getTime())) {
          return res.status(400).json({ error: 'Invalid scheduled date format' });
        }
      }

      // Create room
      const newRoom = await db.insert(rooms).values({
        name,
        language,
        topic,
        maxParticipants,
        hostId: userId,
        scheduledDate: parsedScheduledDate,
        scheduledTime,
      }).returning();

      const room = newRoom[0];

      // Add host as participant
      await db.insert(participants).values({
        userId,
        roomId: room.id,
        isHost: true,
      });

      res.status(201).json({
        id: room.id,
        name: room.name,
        language: room.language,
        topic: room.topic,
        maxParticipants: room.maxParticipants,
        hostId: room.hostId,
        isOpen: room.isOpen,
        scheduledDate: room.scheduledDate,
        scheduledTime: room.scheduledTime,
        createdAt: room.createdAt,
      });
    } catch (error) {
      console.error('Create room error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to create room'
      });
    }
  }


  static async updateRoom(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user is the host of the room
      const room = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);

      if (room.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (room[0].hostId !== userId) {
        return res.status(403).json({ error: 'Only the host can update the room' });
      }

      const updates = req.body;

      // Remove fields that shouldn't be updated
      delete updates.id;
      delete updates.hostId;
      delete updates.createdAt;

      const updatedRoom = await db
        .update(rooms)
        .set(updates)
        .where(eq(rooms.id, id))
        .returning();

      if (updatedRoom.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const roomData = updatedRoom[0];

      res.json({
        id: roomData.id,
        name: roomData.name,
        language: roomData.language,
        topic: roomData.topic,
        maxParticipants: roomData.maxParticipants,
        hostId: roomData.hostId,
        isOpen: roomData.isOpen,
        scheduledDate: roomData.scheduledDate,
        scheduledTime: roomData.scheduledTime,
        createdAt: roomData.createdAt,
      });
    } catch (error) {
      console.error('Update room error:', error);
      res.status(500).json({
        error: 'Failed to update room'
      });
    }
  }

  static async deleteRoom(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user is the host of the room
      const room = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);

      if (room.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (room[0].hostId !== userId) {
        return res.status(403).json({ error: 'Only the host can delete the room' });
      }

      // Delete all participants first (due to foreign key constraints)
      await db.delete(participants).where(eq(participants.roomId, id));

      // Delete the room
      const deletedRoom = await db
        .delete(rooms)
        .where(eq(rooms.id, id))
        .returning();

      if (deletedRoom.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      console.error('Delete room error:', error);
      res.status(500).json({
        error: 'Failed to delete room'
      });
    }
  }



  static async getRooms(req: AuthRequest, res: Response) {
    try {
      const { language, limit = 20, offset = 0 } = req.query;

      // Get current timestamp for filtering
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1); // Add 1 day

      let query = db.select({
        id: rooms.id,
        name: rooms.name,
        language: rooms.language,
        topic: rooms.topic,
        maxParticipants: rooms.maxParticipants,
        hostId: rooms.hostId,
        isOpen: rooms.isOpen,
        scheduledDate: rooms.scheduledDate,
        scheduledTime: rooms.scheduledTime,
        createdAt: rooms.createdAt,
        host: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
        .from(rooms)
        .innerJoin(users, eq(rooms.hostId, users.id))
        .where(and(
          eq(rooms.isOpen, true),
          // Show immediate rooms (no scheduling info) or scheduled rooms within 1 day range
          sql`((${rooms.scheduledDate} IS NULL AND ${rooms.scheduledTime} IS NULL) OR (${rooms.scheduledDate} IS NOT NULL AND ${rooms.scheduledTime} IS NOT NULL AND ${rooms.scheduledDate} >= NOW()::date - INTERVAL '1 day'))`
        ))
        .orderBy(desc(rooms.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      if (language) {
        query = query.where(eq(rooms.language, language as string));
      }

      const roomList = await query;

      res.json(roomList);
    } catch (error) {
      console.error('Get rooms error:', error);
      res.status(500).json({
        error: 'Failed to get rooms'
      });
    }
  }

  static async getRoom(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const room = await db.select({
        id: rooms.id,
        name: rooms.name,
        language: rooms.language,
        topic: rooms.topic,
        maxParticipants: rooms.maxParticipants,
        hostId: rooms.hostId,
        isOpen: rooms.isOpen,
        scheduledDate: rooms.scheduledDate,
        scheduledTime: rooms.scheduledTime,
        createdAt: rooms.createdAt,
        host: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
        .from(rooms)
        .innerJoin(users, eq(rooms.hostId, users.id))
        .where(eq(rooms.id, id))
        .limit(1);

      if (room.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Get participants separately
      const roomParticipants = await db.select({
        id: participants.id,
        userId: participants.userId,
        joinedAt: participants.joinedAt,
        isMuted: participants.isMuted,
        isHost: participants.isHost,
        user: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          isOnline: users.isOnline,
        },
      })
        .from(participants)
        .innerJoin(users, eq(participants.userId, users.id))
        .where(eq(participants.roomId, id));

      const roomWithParticipants = {
        ...room[0],
        participants: roomParticipants,
      };

      res.json(roomWithParticipants);
    } catch (error) {
      console.error('Get room error:', error);
      res.status(500).json({
        error: 'Failed to get room'
      });
    }
  }

  static async getMyRooms(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const myRooms = await db.select({
        id: rooms.id,
        name: rooms.name,
        language: rooms.language,
        topic: rooms.topic,
        maxParticipants: rooms.maxParticipants,
        hostId: rooms.hostId,
        isOpen: rooms.isOpen,
        scheduledDate: rooms.scheduledDate,
        scheduledTime: rooms.scheduledTime,
        createdAt: rooms.createdAt,
      })
        .from(rooms)
        .innerJoin(participants, eq(rooms.id, participants.roomId))
        .where(eq(participants.userId, userId))
        .orderBy(desc(rooms.createdAt));

      res.json(myRooms);
    } catch (error) {
      console.error('Get my rooms error:', error);
      res.status(500).json({
        error: 'Failed to get my rooms'
      });
    }
  }

  static async getScheduledRooms(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get scheduled rooms starting from today and later
      const scheduledRoomsData = await db.select({
        id: rooms.id,
        name: rooms.name,
        language: rooms.language,
        topic: rooms.topic,
        maxParticipants: rooms.maxParticipants,
        hostId: rooms.hostId,
        isOpen: rooms.isOpen,
        scheduledDate: rooms.scheduledDate,
        scheduledTime: rooms.scheduledTime,
        createdAt: rooms.createdAt,
        host: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
        participantCount: sql<number>`count(${participants.id})`,
      })
        .from(rooms)
        .innerJoin(users, eq(rooms.hostId, users.id))
        .leftJoin(participants, eq(rooms.id, participants.roomId))
        .where(and(
          eq(rooms.isOpen, true),
          // Include rooms that have scheduling info from today onwards
          // Handle both old format (full timestamp in scheduledTime) and new format (separate date/time)
          sql`((${rooms.scheduledDate} IS NOT NULL AND ${rooms.scheduledTime} IS NOT NULL AND ${rooms.scheduledDate} >= NOW()::date) OR
               (${rooms.scheduledDate} IS NULL AND ${rooms.scheduledTime} LIKE '%T%' AND ${rooms.scheduledTime}::timestamp >= NOW()))`
        ))
        .groupBy(rooms.id, users.id, users.name, users.avatarUrl)
        .orderBy(desc(rooms.scheduledDate), desc(rooms.scheduledTime));

      // Transform the data to match the expected format
      const scheduledRooms = scheduledRoomsData.map((room: any) => {
        // Handle both formats: new format (separate date/time) or old format (full timestamp in scheduledTime)
        let scheduledTimeString = '';
        if (room.scheduledDate && room.scheduledTime && !room.scheduledTime.includes('T')) {
          // New format: combine date and time
          const dateStr = room.scheduledDate instanceof Date ? room.scheduledDate.toISOString().split('T')[0] : String(room.scheduledDate).split('T')[0];
          scheduledTimeString = `${dateStr}T${room.scheduledTime}`;
        } else if (room.scheduledTime && room.scheduledTime.includes('T')) {
          // Old format: scheduledTime already contains full timestamp
          scheduledTimeString = room.scheduledTime;
        }

        return {
          id: room.id,
          name: room.name,
          topic: room.topic,
          language: room.language,
          maxParticipants: room.maxParticipants,
          participants: [],
          hostId: room.hostId,
          hostName: room.host.name,
          isOpen: room.isOpen,
          scheduledTime: scheduledTimeString,
          description: room.topic,
          participantCount: room.participantCount,
        };
      });

      res.json(scheduledRooms);
    } catch (error) {
      console.error('Get scheduled rooms error:', error);
      res.status(500).json({
        error: 'Failed to get scheduled rooms'
      });
    }
  }


  static async joinRoom(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if room exists and is open
      const room = await db.select().from(rooms).where(and(eq(rooms.id, id), eq(rooms.isOpen, true))).limit(1);

      if (room.length === 0) {
        return res.status(404).json({ error: 'Room not found or closed' });
      }

      // Check if user is already a participant
      const existingParticipant = await db
        .select()
        .from(participants)
        .where(and(eq(participants.roomId, id), eq(participants.userId, userId)))
        .limit(1);

      if (existingParticipant.length > 0) {
        // User is already a participant, return success
        return res.json({ message: 'Already a participant in this room' });
      }

      // Check participant count
      const participantCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(participants)
        .where(eq(participants.roomId, id));

      if (participantCount[0]?.count >= room[0].maxParticipants) {
        return res.status(400).json({ error: 'Room is full' });
      }

      // Add user as participant
      await db.insert(participants).values({
        userId,
        roomId: id,
        isHost: false,
      });

      res.json({ message: 'Successfully joined room' });
    } catch (error) {
      console.error('Join room error:', error);
      res.status(500).json({
        error: 'Failed to join room'
      });
    }
  }

  static async leaveRoom(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Remove user from participants
      const deletedParticipant = await db
        .delete(participants)
        .where(and(eq(participants.roomId, id), eq(participants.userId, userId)))
        .returning();

      if (deletedParticipant.length === 0) {
        return res.status(404).json({ error: 'Not a participant in this room' });
      }

      res.json({ message: 'Successfully left room' });
    } catch (error) {
      console.error('Leave room error:', error);
      res.status(500).json({
        error: 'Failed to leave room'
      });
    }
  }

  static async kickUser(req: AuthRequest, res: Response) {
    try {
      const { id, userId } = req.params;
      const hostId = req.user?.id;

      if (!hostId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if the requester is the host of the room
      const room = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);

      if (room.length === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (room[0].hostId !== hostId) {
        return res.status(403).json({ error: 'Only the host can kick users' });
      }

      // Cannot kick yourself
      if (userId === hostId) {
        return res.status(400).json({ error: 'Cannot kick yourself' });
      }

      // Remove user from participants
      const deletedParticipant = await db
        .delete(participants)
        .where(and(eq(participants.roomId, id), eq(participants.userId, userId)))
        .returning();

      if (deletedParticipant.length === 0) {
        return res.status(404).json({ error: 'User is not a participant in this room' });
      }

      // Broadcast kick event to all clients in the room
      broadcastToRoom(id, {
        type: 'user:kicked',
        userId: userId,
        roomId: id,
        timestamp: new Date().toISOString()
      });

      res.json({ message: 'User successfully kicked from room' });
    } catch (error) {
      console.error('Kick user error:', error);
      res.status(500).json({
        error: 'Failed to kick user'
      });
    }
  }

  static async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content, type = 'text' } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Check if user is participant in the room
      const participant = await db
        .select()
        .from(participants)
        .where(and(eq(participants.roomId, id), eq(participants.userId, userId)))
        .limit(1);

      if (participant.length === 0) {
        return res.status(403).json({ error: 'Not authorized to send messages to this room' });
      }

      // Insert the message
      const newMessage = await db.insert(messages).values({
        content: content.trim(),
        userId,
        roomId: id,
        type,
      }).returning();

      // Get the message with sender info
      const messageWithSender = await db
        .select({
          id: messages.id,
          content: messages.content,
          userId: messages.userId,
          roomId: messages.roomId,
          timestamp: messages.timestamp,
          type: messages.type,
          sender: {
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.id, newMessage[0].id))
        .limit(1);

      // Broadcast the message to all clients in the room
      broadcastToRoom(id, {
        type: 'chat:message',
        message: messageWithSender[0],
        timestamp: new Date().toISOString()
      });

      res.status(201).json(messageWithSender[0]);
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        error: 'Failed to send message'
      });
    }
  }

  static async getMessages(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if user is participant in the room
      const participant = await db
        .select()
        .from(participants)
        .where(and(eq(participants.roomId, id), eq(participants.userId, userId)))
        .limit(1);

      if (participant.length === 0) {
        return res.status(403).json({ error: 'Not authorized to view messages for this room' });
      }

      // Get messages with sender info
      const roomMessages = await db
        .select({
          id: messages.id,
          content: messages.content,
          userId: messages.userId,
          roomId: messages.roomId,
          timestamp: messages.timestamp,
          type: messages.type,
          sender: {
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.roomId, id))
        .orderBy(desc(messages.timestamp))
        .limit(50); // Limit to last 50 messages

      res.json(roomMessages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        error: 'Failed to get messages'
      });
    }
  }

}
