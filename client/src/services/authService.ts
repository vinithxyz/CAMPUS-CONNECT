import { api } from './api';
import type { User } from '../types';

export const authService = {
  register: (d: { name: string; rollNumber: string; email: string; password: string }) =>
    api.post<{ data: User }>('/auth/register', d).then((r) => r.data.data),
  login: (d: { identifier: string; password: string; remember?: boolean }) =>
    api.post<{ data: User }>('/auth/login', d).then((r) => r.data.data),
  google: (credential: string) =>
    api.post<{ data: User }>('/auth/google', { credential }).then((r) => r.data.data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ data: User }>('/auth/me').then((r) => r.data.data),
  updateProfile: (d: { name?: string; rollNumber?: string }) =>
    api.patch<{ data: User }>('/users/me', d).then((r) => r.data.data),
};
