import { apiRequest } from '../queryClient';

export interface CreateRoomData {
  name: string;
  language: string;
  topic?: string;
  maxParticipants: number;
  scheduledDate?: Date;
  scheduledTime?: string;
}

export interface Room {
  id: string;
  name: string;
  language: string;
  topic?: string;
  maxParticipants: number;
  hostId: string;
  isOpen: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
  host?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  participants?: Array<{
    id: string;
    userId: string;
    joinedAt: string;
    isMuted?: boolean;
    isHost?: boolean;
    user: {
      id: string;
      name: string;
      avatarUrl?: string;
      isOnline?: boolean;
    };
  }>;
  participantCount?: number;
}

export interface RoomWithHost extends Room {
  host: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface ScheduledRoom {
  id: string;
  name: string;
  topic?: string;
  language: string;
  maxParticipants: number;
  participants?: string[];
  hostId: string;
  hostName?: string;
  isOpen: boolean;
  scheduledTime: string;
  description?: string;
  participantCount?: number;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

export class RoomAPI {
  static async createRoom(roomData: CreateRoomData): Promise<Room> {
    return apiRequest<Room>('POST', '/api/rooms', roomData);
  }

  static async getRooms(params?: {
    language?: string;
    limit?: number;
    offset?: number;
  }): Promise<RoomWithHost[]> {
    const searchParams = new URLSearchParams();
    if (params?.language) searchParams.append('language', params.language);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return apiRequest<RoomWithHost[]>('GET', '/api/rooms' + (queryString ? `?${queryString}` : ''));
  }

  static async getRoom(id: string): Promise<Room> {
    return apiRequest<Room>('GET', `/api/rooms/${id}`);
  }

  static async joinRoom(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('POST', `/api/rooms/${id}/join`);
  }

  static async leaveRoom(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('POST', `/api/rooms/${id}/leave`);
  }

  static async getMyRooms(): Promise<Room[]> {
    return apiRequest<Room[]>('GET', '/api/rooms/my');
  }

  static async getScheduledRooms(params?: {
    language?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScheduledRoom[]> {
    const searchParams = new URLSearchParams();
    if (params?.language) searchParams.append('language', params.language);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return apiRequest<ScheduledRoom[]>('GET', '/api/rooms/scheduled' + (queryString ? `?${queryString}` : ''));
  }
}
