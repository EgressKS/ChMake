import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db';
import { users, notifications } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { loginUserSchema, insertUserSchema, AuthResponse } from '../shared/schema';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: AuthRequest, res: Response) {
    try {
      console.log('Registration attempt:', req.body.email);
      const { name, email, password, nativeLanguage, learningLanguages, bio } = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({
          error: 'User already exists with this email'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const newUser = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        nativeLanguage,
        learningLanguages,
        bio,
      }).returning();

      const user = newUser[0];

      // Create welcome notification for new user
      await db.insert(notifications).values({
        userId: user.id,
        type: 'system',
        title: 'Welcome to Talklocal!',
        message: 'Welcome to Talklocal! Start practicing languages and connect with others. Check out rooms to begin your language learning journey.',
        data: { welcomeType: 'first_registration' },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || undefined,
          nativeLanguage: user.nativeLanguage || undefined,
          learningLanguages: user.learningLanguages || undefined,
          bio: user.bio || undefined,
          isOnline: true,
          lastSeen: new Date(),
        },
        token,
      };

      res.status(201).json(authResponse);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = loginUserSchema.parse(req.body);

      // Find user
      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (userResult.length === 0) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      const user = userResult[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Update last seen
      await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, user.id));

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl || undefined,
          nativeLanguage: user.nativeLanguage || undefined,
          learningLanguages: user.learningLanguages || undefined,
          bio: user.bio || undefined,
          isOnline: true,
          lastSeen: new Date(),
        },
        token,
      };

      res.json(authResponse);
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (userResult.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult[0];

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || undefined,
        nativeLanguage: user.nativeLanguage || undefined,
        learningLanguages: user.learningLanguages || undefined,
        bio: user.bio || undefined,
        isOnline: true,
        lastSeen: user.lastSeen,
        birthday: user.birthday || undefined,
        gender: user.gender || undefined,
        nationality: user.nationality || undefined,
        practiceLanguage: user.practiceLanguage || undefined,
        instagramId: user.instagramId || undefined,
        websiteUrl: user.websiteUrl || undefined,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to get profile'
      });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updates = req.body;

      // Remove fields that shouldn't be updated directly
      delete updates.id;
      delete updates.email;
      delete updates.password;
      delete updates.createdAt;

      // Convert birthday string to Date object if provided
      if (updates.birthday) {
        // Handle HTML date input format (YYYY-MM-DD)
        const birthdayValue = updates.birthday;
        if (typeof birthdayValue === 'string' && birthdayValue.trim() !== '') {
          const dateObj = new Date(birthdayValue);
          // Validate the date is valid
          if (isNaN(dateObj.getTime())) {
            throw new Error('Invalid birthday format');
          }
          updates.birthday = dateObj;
        } else {
          // Remove invalid/empty birthday values
          delete updates.birthday;
        }
      }

      const updatedUser = await db
        .update(users)
        .set({ ...updates, lastSeen: new Date() })
        .where(eq(users.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = updatedUser[0];

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || undefined,
        nativeLanguage: user.nativeLanguage || undefined,
        learningLanguages: user.learningLanguages || undefined,
        bio: user.bio || undefined,
        isOnline: true,
        lastSeen: user.lastSeen,
        birthday: user.birthday || undefined,
        gender: user.gender || undefined,
        nationality: user.nationality || undefined,
        practiceLanguage: user.practiceLanguage || undefined,
        instagramId: user.instagramId || undefined,
        websiteUrl: user.websiteUrl || undefined,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile'
      });
    }
  }
}
