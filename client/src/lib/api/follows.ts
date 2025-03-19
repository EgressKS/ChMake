import { apiRequest } from '../queryClient';

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
  nativeLanguage?: string;
}

export interface FollowData {
  followerId: string;
  followingId: string;
}

export class FollowAPI {
  // Follow a user
  static async followUser(userId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('POST', '/api/follows/follow', { followingId: userId });
  }

  // Unfollow a user
  static async unfollowUser(userId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('POST', '/api/follows/unfollow', { followingId: userId });
  }

  // Get followers of a user
  static async getFollowers(userId?: string, params?: { limit?: number; offset?: number }): Promise<UserSummary[]> {
    const searchParams = new URLSearchParams();
    if (userId) searchParams.append('userId', userId);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return apiRequest<UserSummary[]>('GET', `/api/follows/followers${queryString ? `?${queryString}` : ''}`);
  }

  // Get users you are following
  static async getFollowing(userId?: string, params?: { limit?: number; offset?: number }): Promise<UserSummary[]> {
    const searchParams = new URLSearchParams();
    if (userId) searchParams.append('userId', userId);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return apiRequest<UserSummary[]>('GET', `/api/follows/following${queryString ? `?${queryString}` : ''}`);
  }

  // Check if you're following a user
  static async isFollowing(userId: string): Promise<boolean> {
    try {
      const result = await apiRequest<{ isFollowing: boolean }>('GET', `/api/follows/is-following/${userId}`);
      return result.isFollowing;
    } catch {
      return false;
    }
  }

  // Get followers count
  static async getFollowersCount(userId: string): Promise<{ count: number }> {
    return apiRequest<{ count: number }>('GET', `/api/follows/followers-count/${userId}`);
  }

  // Get following count
  static async getFollowingCount(userId: string): Promise<{ count: number }> {
    return apiRequest<{ count: number }>('GET', `/api/follows/following-count/${userId}`);
  }

  // Accept follow request
  static async acceptFollowRequest(followerId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('POST', `/api/follows/accept-follow/${followerId}`);
  }

  // Decline follow request
  static async declineFollowRequest(followerId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('POST', `/api/follows/decline-follow/${followerId}`);
  }
}
