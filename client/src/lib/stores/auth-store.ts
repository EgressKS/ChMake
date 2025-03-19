import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthAPI, LoginCredentials, RegisterData, UpdateProfileData } from '../api/auth';

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
  birthday?: Date;
  gender?: string;
  nationality?: string;
  practiceLanguage?: string;
  instagramId?: string;
  websiteUrl?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: UpdateProfileData) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAuth: (data: { user: User; token: string }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await AuthAPI.login({ email, password });

          set({
            user: response.user,
            accessToken: response.token,
            isAuthenticated: true,
            isLoading: false
          });

          // Store token in localStorage for API requests
          localStorage.setItem('accessToken', response.token);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await AuthAPI.register(userData);

          set({
            user: response.user,
            accessToken: response.token,
            isAuthenticated: true,
            isLoading: false
          });

          // Store token in localStorage for API requests
          localStorage.setItem('accessToken', response.token);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      updateProfile: async (updates: UpdateProfileData) => {
        try {
          const updatedUser = await AuthAPI.updateProfile(updates);
          set({ user: updatedUser });
        } catch (error) {
          throw error;
        }
      },

      refreshProfile: async () => {
        try {
          const user = await AuthAPI.getProfile();
          set({ user });
        } catch (error) {
          // If profile fetch fails, logout user
          get().logout();
          throw error;
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setAuth: (data) => {
        set({
          user: data.user,
          accessToken: data.token,
          isAuthenticated: true
        });
        // Store token in localStorage for API requests
        localStorage.setItem('accessToken', data.token);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken
      }),
    }
  )
);
