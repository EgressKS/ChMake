import { Response } from 'express';
import { db } from '../lib/db';
import { users, follows } from '../shared/schema';
import { eq, and, or, ilike, sql, desc, asc } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  static async searchUsers(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        query = '',
        status = 'all',
        language = 'all',
        sortBy = 'name',
        sortOrder = 'asc',
        limit = 20,
        offset = 0
      } = req.query as {
        query?: string;
        status?: string;
        language?: string;
        sortBy?: string;
        sortOrder?: string;
        limit?: string;
        offset?: string;
      };

      // Build where conditions
      const whereConditions = [];

      // Exclude current user from results
      if (userId) {
        whereConditions.push(sql`${users.id} != ${userId}`);
      }

      // Search query - search in name, email, bio, location
      if (query && query.length >= 3) {
        whereConditions.push(
          or(
            ilike(users.name, `%${query}%`),
            ilike(users.email, `%${query}%`),
            ilike(users.bio, `%${query}%`),
            ilike(users.location, `%${query}%`),
            ilike(users.nativeLanguage, `%${query}%`),
            sql`EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(${users.learningLanguages}) AS lang
              WHERE lang ILIKE ${`%${query}%`}
            )`
          )
        );
      }

      // Status filter
      if (status !== 'all') {
        if (status === 'online') {
          whereConditions.push(eq(users.isOnline, true));
        } else if (status === 'offline') {
          whereConditions.push(eq(users.isOnline, false));
        }
        // For 'away' and 'busy', we might need additional status fields
        // For now, we'll treat them as online with additional logic if needed
      }

      // Language filter
      if (language !== 'all') {
        whereConditions.push(
          or(
            eq(users.nativeLanguage, language as string),
            sql`EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(${users.learningLanguages}) AS lang
              WHERE lang = ${language}
            )`
          )
        );
      }

      // Build order by clause
      let orderBy;
      switch (sortBy) {
        case 'name':
          orderBy = sortOrder === 'desc' ? desc(users.name) : asc(users.name);
          break;
        case 'status':
          orderBy = sortOrder === 'desc' ? desc(users.isOnline) : asc(users.isOnline);
          break;
        case 'lastSeen':
          orderBy = sortOrder === 'desc' ? desc(users.lastSeen) : asc(users.lastSeen);
          break;
        case 'joinDate':
          orderBy = sortOrder === 'desc' ? desc(users.createdAt) : asc(users.createdAt);
          break;
        default:
          orderBy = asc(users.name);
      }

      // Get users with follow status if user is authenticated
      let usersQuery = db
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
          location: users.location,
          learningStreak: users.learningStreak,
          totalRooms: users.totalRooms,
          birthday: users.birthday,
          gender: users.gender,
          nationality: users.nationality,
          practiceLanguage: users.practiceLanguage,
          instagramId: users.instagramId,
          websiteUrl: users.websiteUrl,
          joinDate: users.createdAt,
          isFollowing: userId ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${follows}
            WHERE ${follows.followerId} = ${userId} AND ${follows.followingId} = ${users.id}
          )` : sql<boolean>`false`,
          isFollower: userId ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${follows}
            WHERE ${follows.followerId} = ${users.id} AND ${follows.followingId} = ${userId}
          )` : sql<boolean>`false`,
        })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(orderBy)
        .limit(Number(limit))
        .offset(Number(offset));

      const searchResults = await usersQuery;

      // Transform results to match frontend interface
      const transformedResults = searchResults.map((user: any) => ({
        ...user,
        status: user.isOnline ? 'online' : 'offline',
        languages: [
          ...(user.nativeLanguage ? [{ code: user.nativeLanguage, level: 'native' }] : []),
          ...(user.learningLanguages ? user.learningLanguages.map((lang: string) => ({ code: lang, level: 'learning' })) : [])
        ].filter((lang: any) => lang.code), // Filter out empty codes
        lastSeen: user.lastSeen?.toISOString(),
        joinDate: user.joinDate?.toISOString(),
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        error: 'Failed to search users'
      });
    }
  }

  static async getTrendingUsers(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit = 10 } = req.query;

      // Get users with most followers and recent activity
      const trendingUsers = await db
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
          location: users.location,
          learningStreak: users.learningStreak,
          totalRooms: users.totalRooms,
          joinDate: users.createdAt,
          followerCount: sql<number>`(
            SELECT COUNT(*) FROM ${follows} WHERE ${follows.followingId} = ${users.id}
          )`,
          isFollowing: userId ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${follows}
            WHERE ${follows.followerId} = ${userId} AND ${follows.followingId} = ${users.id}
          )` : sql<boolean>`false`,
        })
        .from(users)
        .where(userId ? sql`${users.id} != ${userId}` : undefined)
        .orderBy(
          desc(sql<number>`(
            SELECT COUNT(*) FROM ${follows} WHERE ${follows.followingId} = ${users.id}
          )`),
          desc(users.learningStreak),
          desc(users.totalRooms)
        )
        .limit(Number(limit));

      // Transform results
      const transformedResults = trendingUsers.map((user: any) => ({
        ...user,
        status: user.isOnline ? 'online' : 'offline',
        languages: [
          ...(user.nativeLanguage ? [{ code: user.nativeLanguage, level: 'native' }] : []),
          ...(user.learningLanguages ? user.learningLanguages.map((lang: string) => ({ code: lang, level: 'learning' })) : [])
        ].filter((lang: any) => lang.code),
        lastSeen: user.lastSeen?.toISOString(),
        joinDate: user.joinDate?.toISOString(),
      }));

      res.json(transformedResults);
    } catch (error) {
      console.error('Get trending users error:', error);
      res.status(500).json({
        error: 'Failed to get trending users'
      });
    }
  }

  static async getUserProfile(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      const userProfile = await db
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
          location: users.location,
          learningStreak: users.learningStreak,
          totalRooms: users.totalRooms,
          birthday: users.birthday,
          gender: users.gender,
          nationality: users.nationality,
          practiceLanguage: users.practiceLanguage,
          instagramId: users.instagramId,
          websiteUrl: users.websiteUrl,
          joinDate: users.createdAt,
          isFollowing: currentUserId ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${follows}
            WHERE ${follows.followerId} = ${currentUserId} AND ${follows.followingId} = ${users.id}
          )` : sql<boolean>`false`,
          isFollower: currentUserId ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${follows}
            WHERE ${follows.followerId} = ${users.id} AND ${follows.followingId} = ${currentUserId}
          )` : sql<boolean>`false`,
          followersCount: sql<number>`(
            SELECT COUNT(*) FROM ${follows} WHERE ${follows.followingId} = ${users.id}
          )`,
          followingCount: sql<number>`(
            SELECT COUNT(*) FROM ${follows} WHERE ${follows.followerId} = ${users.id}
          )`,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userProfile.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userProfile[0];

      // Transform result
      const transformedUser = {
        ...user,
        status: user.isOnline ? 'online' : 'offline',
        languages: [
          ...(user.nativeLanguage ? [{ code: user.nativeLanguage, level: 'native' }] : []),
          ...(user.learningLanguages ? user.learningLanguages.map((lang: string) => ({ code: lang, level: 'learning' })) : [])
        ].filter((lang: any) => lang.code),
        lastSeen: user.lastSeen?.toISOString(),
        joinDate: user.joinDate?.toISOString(),
        birthday: user.birthday?.toISOString(),
      };

      res.json(transformedUser);
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        error: 'Failed to get user profile'
      });
    }
  }
}
