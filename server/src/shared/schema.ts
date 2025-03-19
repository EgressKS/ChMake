import { z } from 'zod';

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
] as const;

export const insertRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Room name too long'),
  language: z.string().min(2, 'Please select a language').max(10, 'Invalid language code'),
  topic: z.string().max(200, 'Topic too long').optional(),
  maxParticipants: z.number().min(2, 'At least 2 participants required').max(50, 'Maximum 50 participants'),
  hostId: z.string().optional(),
  isOpen: z.boolean().default(true),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;

export interface Room {
  id: string;
  name: string;
  language: string;
  topic?: string;
  maxParticipants: number;
  hostId: string;
  isOpen: boolean;
  scheduledDate?: Date;
  scheduledTime?: string;
  createdAt: Date;
  participants?: User[];
}

export interface RoomWithHost extends Room {
  host: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  nativeLanguage?: string;
  learningLanguages?: string[];
  bio?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  location?: string;
  joinDate?: Date;
  learningStreak?: number;
  totalRooms?: number;
  isFollowing?: boolean;
  isFollower?: boolean;
  status?: 'online' | 'away' | 'busy' | 'offline';
  languages?: Array<{ code: string; level: string }>;
  birthday?: Date;
  gender?: string;
  nationality?: string;
  practiceLanguage?: string;
  instagramId?: string;
  websiteUrl?: string;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  roomId: string;
  timestamp: Date;
  type: 'text' | 'audio' | 'system';
}

export interface Participant {
  id: string;
  userId: string;
  roomId: string;
  joinedAt: Date;
  isMuted?: boolean;
  isHost?: boolean;
}

export interface MessageWithSender {
  id: string;
  content: string;
  userId: string;
  roomId: string;
  timestamp: Date;
  type: 'text' | 'audio' | 'system';
  sender?: User;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export interface InsertUser {
  name: string;
  email: string;
  password: string;
  nativeLanguage?: string;
  learningLanguages?: string[];
  bio?: string;
}

export const insertUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  nativeLanguage: z.string().optional(),
  learningLanguages: z.array(z.string()).optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
});

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'follow' | 'room_invite' | 'room_mention' | 'system' | 'like';
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

// Database schema definitions
import { pgTable, text, timestamp, boolean, integer, uuid, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  avatarUrl: text('avatar_url'),
  nativeLanguage: text('native_language'),
  learningLanguages: jsonb('learning_languages').$type<string[]>(),
  bio: text('bio'),
  isOnline: boolean('is_online').default(false),
  lastSeen: timestamp('last_seen').defaultNow(),
  location: text('location'),
  learningStreak: integer('learning_streak').default(0),
  totalRooms: integer('total_rooms').default(0),
  birthday: timestamp('birthday'),
  gender: text('gender'),
  nationality: text('nationality'),
  practiceLanguage: text('practice_language'),
  instagramId: text('instagram_id'),
  websiteUrl: text('website_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  language: text('language').notNull(),
  topic: text('topic'),
  maxParticipants: integer('max_participants').notNull(),
  hostId: uuid('host_id').notNull().references(() => users.id),
  isOpen: boolean('is_open').default(true),
  scheduledDate: timestamp('scheduled_date'),
  scheduledTime: text('scheduled_time'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const participants = pgTable('participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  roomId: uuid('room_id').notNull().references(() => rooms.id),
  joinedAt: timestamp('joined_at').defaultNow(),
  isMuted: boolean('is_muted').default(false),
  isHost: boolean('is_host').default(false),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  roomId: uuid('room_id').notNull().references(() => rooms.id),
  timestamp: timestamp('timestamp').defaultNow(),
  type: text('type').default('text'),
});

export const follows = pgTable('follows', {
  id: uuid('id').primaryKey().defaultRandom(),
  followerId: uuid('follower_id').notNull().references(() => users.id),
  followingId: uuid('following_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  roomId: uuid('room_id').notNull().references(() => rooms.id),
  createdAt: timestamp('created_at').defaultNow(),
});
