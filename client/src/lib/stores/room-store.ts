import { create } from 'zustand';
import { RoomAPI, Room, CreateRoomData } from '../api/rooms';

export interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  myRooms: Room[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createRoom: (roomData: CreateRoomData) => Promise<Room>;
  fetchRooms: (params?: { language?: string; limit?: number; offset?: number }) => Promise<void>;
  fetchRoom: (id: string) => Promise<void>;
  joinRoom: (id: string) => Promise<void>;
  leaveRoom: (id: string) => Promise<void>;
  fetchMyRooms: () => Promise<void>;
  setCurrentRoom: (room: Room | null) => void;
  clearError: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  myRooms: [],
  isLoading: false,
  error: null,

  createRoom: async (roomData: CreateRoomData) => {
    set({ isLoading: true, error: null });
    try {
      const newRoom = await RoomAPI.createRoom(roomData);

      // Add to rooms list if it's open
      if (newRoom.isOpen) {
        set((state) => ({
          rooms: [newRoom, ...state.rooms],
          myRooms: [newRoom, ...state.myRooms],
          isLoading: false,
        }));
      } else {
        set((state) => ({
          myRooms: [newRoom, ...state.myRooms],
          isLoading: false,
        }));
      }

      return newRoom;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create room',
        isLoading: false
      });
      throw error;
    }
  },

  fetchRooms: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await RoomAPI.getRooms(params);
      set({ rooms, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch rooms',
        isLoading: false
      });
    }
  },

  fetchRoom: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const room = await RoomAPI.getRoom(id);
      set({ currentRoom: room, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch room',
        isLoading: false
      });
    }
  },

  joinRoom: async (id: string) => {
    set({ error: null });
    try {
      await RoomAPI.joinRoom(id);

      // Refresh current room if it's the one we joined
      const currentRoom = get().currentRoom;
      if (currentRoom?.id === id) {
        await get().fetchRoom(id);
      }

      // Refresh rooms list
      await get().fetchRooms();
    } catch (error: any) {
      set({ error: error.message || 'Failed to join room' });
      throw error;
    }
  },

  leaveRoom: async (id: string) => {
    set({ error: null });
    try {
      await RoomAPI.leaveRoom(id);

      // Remove from my rooms
      set((state) => ({
        myRooms: state.myRooms.filter(room => room.id !== id),
      }));

      // Clear current room if it's the one we left
      const currentRoom = get().currentRoom;
      if (currentRoom?.id === id) {
        set({ currentRoom: null });
      }

      // Refresh rooms list
      await get().fetchRooms();
    } catch (error: any) {
      set({ error: error.message || 'Failed to leave room' });
      throw error;
    }
  },

  fetchMyRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const myRooms = await RoomAPI.getMyRooms();
      set({ myRooms, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch my rooms',
        isLoading: false
      });
    }
  },

  setCurrentRoom: (room: Room | null) => {
    set({ currentRoom: room });
  },

  clearError: () => {
    set({ error: null });
  },
}));
