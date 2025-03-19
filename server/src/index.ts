import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set, using default (not recommended for production)');
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic route for health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Import database setup
import { setupDatabase } from './lib/setup-db';

// Import routes
import authRoutes from './router/auth';
import roomRoutes from './router/rooms';
import followRoutes from './router/follows';
import notificationRoutes from './router/notifications';
import reminderRoutes from './router/reminders';
import userRoutes from './router/users';
import { FollowController } from './controller/follow-controller';
import { authenticateToken } from './middleware/auth';

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/', reminderRoutes);

// Direct following route for client compatibility
app.get('/api/following', authenticateToken, FollowController.getMyFollowing);

// Setup database connection
setupDatabase().catch((error) => {
  console.error('Failed to setup database:', error);
  // Continue starting the server even if DB setup fails
  // The first request that needs DB will show the error
});

// WebSocket room management
const rooms = new Map<string, Set<WebSocket>>();
const userRooms = new Map<WebSocket, string>();

// WebSocket connection handling
wss.on('connection', (ws, request) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Parsed message:', data);

      if (data.type === 'room:join' && data.roomId) {
        // User joining a room
        const roomId = data.roomId;

        // Remove from previous room if any
        const previousRoom = userRooms.get(ws);
        if (previousRoom && rooms.has(previousRoom)) {
          rooms.get(previousRoom)!.delete(ws);
        }

        // Add to new room
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(ws);
        userRooms.set(ws, roomId);

        console.log(`User joined room: ${roomId}`);

      } else if (data.type === 'room:leave' && data.roomId) {
        // User leaving a room
        const roomId = data.roomId;
        if (rooms.has(roomId)) {
          rooms.get(roomId)!.delete(ws);
        }
        userRooms.delete(ws);

        console.log(`User left room: ${roomId}`);

      } else if (data.type === 'room:kick' && data.userId && data.roomId) {
        // Host kicking a user - broadcast to room
        const roomId = data.roomId;
        broadcastToRoom(roomId, {
          type: 'user:kicked',
          userId: data.userId,
          roomId: roomId,
          timestamp: new Date().toISOString()
        });

        console.log(`User ${data.userId} kicked from room: ${roomId}`);

      } else if (data.type === 'speak:request' && data.roomId && data.userId && data.userName) {
        // User requesting to speak - broadcast to room (host will handle)
        const roomId = data.roomId;
        broadcastToRoom(roomId, {
          type: 'speak:request',
          userId: data.userId,
          userName: data.userName,
          roomId: roomId,
          timestamp: new Date().toISOString()
        });

        console.log(`User ${data.userName} (${data.userId}) requested to speak in room: ${roomId}`);

      } else if (data.type === 'speak:approved' && data.roomId && data.userId) {
        // Host approved speaking request - broadcast to room
        const roomId = data.roomId;
        broadcastToRoom(roomId, {
          type: 'speak:approved',
          userId: data.userId,
          roomId: roomId,
          timestamp: new Date().toISOString()
        });

        console.log(`Speaking request approved for user ${data.userId} in room: ${roomId}`);

      } else if (data.type === 'speak:denied' && data.roomId && data.userId) {
        // Host denied speaking request - broadcast to room
        const roomId = data.roomId;
        broadcastToRoom(roomId, {
          type: 'speak:denied',
          userId: data.userId,
          roomId: roomId,
          timestamp: new Date().toISOString()
        });

        console.log(`Speaking request denied for user ${data.userId} in room: ${roomId}`);

      } else if (data.type === 'user:like' && data.roomId && data.fromUserId && data.fromUserName && data.toUserId) {
        // User liked another user - broadcast to room
        const roomId = data.roomId;
        broadcastToRoom(roomId, {
          type: 'user:like',
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          toUserId: data.toUserId,
          roomId: roomId,
          timestamp: new Date().toISOString()
        });

        console.log(`User ${data.fromUserName} liked user ${data.toUserId} in room: ${roomId}`);
      }

      // Echo back for compatibility
      const response = {
        type: 'echo',
        message: 'Message received successfully',
        receivedData: data,
        timestamp: new Date().toISOString()
      };

      ws.send(JSON.stringify(response));
    } catch (error) {
      // Send error response for non-JSON messages
      const errorResponse = {
        type: 'error',
        message: 'Invalid JSON format',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      ws.send(JSON.stringify(errorResponse));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');

    // Remove from room when connection closes
    const roomId = userRooms.get(ws);
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId)!.delete(ws);
    }
    userRooms.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast message to all clients in a room
function broadcastToRoom(roomId: string, message: any) {
  if (rooms.has(roomId)) {
    const roomClients = rooms.get(roomId)!;
    const messageStr = JSON.stringify(message);

    roomClients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

// Export broadcast function for use in controllers
export { broadcastToRoom };

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
