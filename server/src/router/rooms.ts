import { Router } from 'express';
import { RoomController } from '../controller/room-controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All room routes require authentication
router.use(authenticateToken);

// Room management
router.post('/', RoomController.createRoom);
router.get('/', RoomController.getRooms);
router.get('/my', RoomController.getMyRooms);
router.get('/scheduled', RoomController.getScheduledRooms);

// Room management (PUT and DELETE before wildcard routes)
router.put('/:id', RoomController.updateRoom);
router.delete('/:id', RoomController.deleteRoom);

// Room participation
router.get('/:id', RoomController.getRoom);
router.get('/:id/messages', RoomController.getMessages);
router.post('/:id/messages', RoomController.sendMessage);
router.post('/:id/join', RoomController.joinRoom);
router.post('/:id/leave', RoomController.leaveRoom);
router.delete('/:id/kick/:userId', RoomController.kickUser);

export default router;
