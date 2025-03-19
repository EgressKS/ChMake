import { Router } from 'express';
import { FollowController } from '../controller/follow-controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All follow routes require authentication
router.use(authenticateToken);

// Follow/unfollow routes
router.post('/follow/:userId', FollowController.follow);
router.delete('/follow/:userId', FollowController.unfollow);

// Follow request management
router.post('/accept-follow/:followerId', FollowController.acceptFollowRequest);
router.post('/decline-follow/:followerId', FollowController.declineFollowRequest);

// Get follow information
router.get('/', FollowController.getMyFollowing);
router.get('/:userId/followers', FollowController.getFollowers);
router.get('/:userId/following', FollowController.getFollowing);
router.get('/:userId/follow-stats', FollowController.getFollowStats);
router.get('/is-following/:userId', FollowController.isFollowing);

export default router;
