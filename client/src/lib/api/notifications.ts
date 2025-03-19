import { apiRequest } from '../queryClient';

export interface Notification {
  id: string;
  userId: string;
  type: 'follow' | 'room_invite' | 'room_mention' | 'system' | 'like';
  title: string;
  message: string;
  isRead: boolean;
  data?: any; // JSON data for additional context
  createdAt: string;
}

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export class NotificationAPI {
  // Get notifications for the current user
  static async getNotifications(params?: {
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return apiRequest<Notification[]>('GET', `/api/notifications${queryString ? `?${queryString}` : ''}`);
  }

  // Get unread notification count
  static async getUnreadCount(): Promise<{ unreadCount: number }> {
    return apiRequest<{ unreadCount: number }>('GET', '/api/notifications/unread-count');
  }

  // Mark specific notifications as read
  static async markAsRead(ids: string[]): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('PATCH', '/api/notifications/mark-read', { ids });
  }

  // Mark all notifications as read
  static async markAllAsRead(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('PATCH', '/api/notifications/mark-all-read');
  }

  // Delete a specific notification
  static async deleteNotification(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('DELETE', `/api/notifications/${id}`);
  }

  // Create notification (admin/admin features)
  static async createNotification(data: CreateNotificationData): Promise<Notification> {
    return apiRequest<Notification>('POST', '/api/notifications/create', data);
  }
}
