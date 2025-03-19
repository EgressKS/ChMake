import { apiRequest } from '../queryClient';
import { User } from '../stores/auth-store';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  nativeLanguage?: string;
  learningLanguages?: string[];
  bio?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UpdateProfileData {
  name?: string;
  nativeLanguage?: string;
  learningLanguages?: string[];
  bio?: string;
  avatarUrl?: string;
  birthday?: Date;
  gender?: string;
  nationality?: string;
  practiceLanguage?: string;
  instagramId?: string;
  websiteUrl?: string;
}

export class AuthAPI {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('POST', '/api/auth/login', credentials);
  }

  static async register(userData: RegisterData): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('POST', '/api/auth/register', userData);
  }

  static async getProfile(): Promise<User> {
    return apiRequest<User>('GET', '/api/auth/profile');
  }

  static async updateProfile(updates: UpdateProfileData): Promise<User> {
    console.log('Sending profile update:', updates);
    return apiRequest<User>('PUT', '/api/auth/profile', updates);
  }
}
