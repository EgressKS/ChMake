import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
      email: string;
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
