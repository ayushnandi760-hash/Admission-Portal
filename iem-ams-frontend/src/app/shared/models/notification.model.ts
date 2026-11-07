/**
 * src/app/shared/models/notification.model.ts
 *
 * Models for student notification feeds.
 */

export interface AppNotification {
  _id: string;
  recipient: string;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  link?: string;
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationFeed {
  notifications: AppNotification[];
  unreadCount: number;
}

