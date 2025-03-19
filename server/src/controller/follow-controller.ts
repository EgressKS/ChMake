import { Response } from 'express';
import { db } from '../lib/db';
import { follows, users, notifications } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

export class FollowController {
  static async follow(req: AuthRequest, res: Response) {
    try {
      const followerId = req.user?.id;
      const { userId: followingId } = req.params;

      if (!followerId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (followerId === followingId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
      }

      // Check if target user exists
      const targetUser = await db.select().from(users).where(eq(users.id, followingId)).limit(1);

      if (targetUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if already following
      const existingFollow = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
        .limit(1);

      if (existingFollow.length > 0) {
        return res.status(400).json({ error: 'Already following this user' });
      }

      // Get follower info for notification
      const followerInfo = await db.select().from(users).where(eq(users.id, followerId)).limit(1);

      // Create follow relationship
      await db.insert(follows).values({
        followerId,
        followingId,
      });

      // Create follow request notification for the user being followed
      if (followerInfo.length > 0) {
        const follower = followerInfo[0];
        await db.insert(notifications).values({
          userId: followingId, // Notify the user who is being followed
          type: 'follow',
          title: 'New Follow Request',
          message: `${follower.name} wants to follow you and connect.`,
          data: {
            followerId: followerId,
            followerName: follower.name,
            followerAvatar: follower.avatarUrl,
          },
        });
      }

      res.status(201).json({ message: 'Successfully followed user' });
    } catch (error) {
      console.error('Follow error:', error);
      res.status(500).json({
        error: 'Failed to follow user'
      });
    }
  }

  static async unfollow(req: AuthRequest, res: Response) {
    try {
      const followerId = req.user?.id;
      const { userId: followingId } = req.params;

      if (!followerId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete follow relationship
      const deletedFollow = await db
        .delete(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
        .returning();

      if (deletedFollow.length === 0) {
        return res.status(400).json({ error: 'Not following this user' });
      }

      res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
      console.error('Unfollow error:', error);
      res.status(500).json({
        error: 'Failed to unfollow user'
      });
    }
  }

  static async getFollowers(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const followers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          nativeLanguage: users.nativeLanguage,
          learningLanguages: users.learningLanguages,
          bio: users.bio,
          isOnline: users.isOnline,
          lastSeen: users.lastSeen,
          createdAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, userId))
        .orderBy(sql`${follows.createdAt} desc`);

      res.json({ followers });
    } catch (error) {
      console.error('Get followers error:', error);
      res.status(500).json({
        error: 'Failed to get followers'
      });
    }
  }

  static async getFollowing(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const following = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          nativeLanguage: users.nativeLanguage,
          learningLanguages: users.learningLanguages,
          bio: users.bio,
          isOnline: users.isOnline,
          lastSeen: users.lastSeen,
          createdAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(users, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, userId))
        .orderBy(sql`${follows.createdAt} desc`);

      res.json({ following });
    } catch (error) {
      console.error('Get following error:', error);
      res.status(500).json({
        error: 'Failed to get following'
      });
    }
  }

  static async isFollowing(req: AuthRequest, res: Response) {
    try {
      const followerId = req.user?.id;
      const { userId: followingId } = req.params;

      if (!followerId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const followRelation = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
        .limit(1);

      res.json({ isFollowing: followRelation.length > 0 });
    } catch (error) {
      console.error('Check follow status error:', error);
      res.status(500).json({
        error: 'Failed to check follow status'
      });
    }
  }

  static async getFollowStats(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const followerCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followingId, userId));

      const followingCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followerId, userId));

      res.json({
        followersCount: followerCount[0].count,
        followingCount: followingCount[0].count,
      });
    } catch (error) {
      console.error('Get follow stats error:', error);
      res.status(500).json({
        error: 'Failed to get follow stats'
      });
    }
  }

  static async acceptFollowRequest(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { followerId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify the follow relationship exists
      const followRelation = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, userId)))
        .limit(1);

      if (followRelation.length === 0) {
        return res.status(404).json({ error: 'Follow request not found' });
      }

      // In the current implementation, accepting just means the relationship exists
      // We could mark it as accepted if we add a status field later
      // For now, we just mark the notification as handled
      await db
        .update(notifications)
        .set({ isRead: true, data: sql`${notifications.data}::jsonb || '{"accepted": true}'` })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.type, 'follow'),
          sql`${notifications.data}->>'followerId' = ${followerId}`
        ));

      res.json({ message: 'Follow request accepted' });
    } catch (error) {
      console.error('Accept follow request error:', error);
      res.status(500).json({
        error: 'Failed to accept follow request'
      });
    }
  }

  static async declineFollowRequest(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { followerId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Remove the follow relationship
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, userId)));

      // Mark notification as handled
      await db
        .update(notifications)
        .set({ isRead: true, data: sql`${notifications.data}::jsonb || '{"declined": true}'` })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.type, 'follow'),
          sql`${notifications.data}->>'followerId' = ${followerId}`
        ));

      res.json({ message: 'Follow request declined' });
    } catch (error) {
      console.error('Decline follow request error:', error);
      res.status(500).json({
        error: 'Failed to decline follow request'
      });
    }
  }

  static async getMyFollowing(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const followingList = await db
        .select({
          followingId: follows.followingId,
        })
        .from(follows)
        .where(eq(follows.followerId, userId));

      res.json(followingList);
    } catch (error) {
      console.error('Get my following error:', error);
      res.status(500).json({
        error: 'Failed to get following list'
      });
    }
  }
}
