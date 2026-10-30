export type Role = 'student' | 'staff' | 'admin';
export type Status = 'pending' | 'in_progress' | 'resolved' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Category =
  | 'electrical'
  | 'plumbing'
  | 'mechanical'
  | 'civil'
  | 'sanitation'
  | 'wifi'
  | 'hostel'
  | 'canteen'
  | 'safety'
  | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  role: Role;
  avatarUrl?: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  isSample: boolean;
}

export interface HistoryEntry {
  status: Status;
  note?: string;
  changedAt: string;
  changedBy?: { name: string; role: Role };
}

export interface Report {
  _id: string;
  reportId: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  building: { _id: string; name: string; code: string };
  room: string;
  location: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  images: { url: string; filename: string }[];
  history: HistoryEntry[];
  reporter?: { _id: string; name: string; rollNumber?: string };
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  byCategory: { category: Category; count: number }[];
}

export interface MapReport {
  reportId: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  room: string;
  building?: string;
  lat: number;
  lng: number;
  createdAt: string;
  isSample: boolean;
}

export type HeatPoint = [number, number, number];

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface NotificationItem {
  _id: string;
  message: string;
  readAt?: string;
  createdAt: string;
  report?: { _id: string; reportId: string; title: string };
}
