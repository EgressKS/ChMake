import express from 'express';
import { UserController } from '../controller/user-controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Search users - requires authentication
router.get('/search', authenticateToken, UserController.searchUsers);

// Get trending users - requires authentication
router.get('/trending', authenticateToken, UserController.getTrendingUsers);

// Get user profile - requires authentication
router.get('/:userId', authenticateToken, UserController.getUserProfile);

export default router;
