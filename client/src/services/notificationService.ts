import { api } from './api';
import type { NotificationItem } from '../types';

export const notificationService = {
  list: () =>
    api
      .get<{ data: NotificationItem[]; meta: { unreadCount: number } }>('/notifications')
      .then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all'),
};
