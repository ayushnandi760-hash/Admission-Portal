/**
 * src/app/shared/models/notification.model.ts
 *
 * Models for student notification feeds.
 */

export interface AppNotification {
  _id: string;
  recipient: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationFeed {
  notifications: AppNotification[];
  unreadCount: number;
}

