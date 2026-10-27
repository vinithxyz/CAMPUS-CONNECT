import type { Category, Priority, Status } from '../types';

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing and Water' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'civil', label: 'Civil and Infrastructure' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'wifi', label: 'Wi-Fi and Internet' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const STATUS_LABEL: Record<Status, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

// Map filter groups (matching PDF checkboxes)
export const MAP_FILTERS = [
  { key: 'electrical', label: 'Electrical', categories: ['electrical'] },
  { key: 'plumbing', label: 'Plumbing', categories: ['plumbing'] },
  { key: 'mechanical', label: 'Mechanical', categories: ['mechanical'] },
  { key: 'civil', label: 'Civil', categories: ['civil'] },
  {
    key: 'others',
    label: 'Others',
    categories: ['sanitation', 'wifi', 'hostel', 'canteen', 'safety', 'other'],
  },
] as const;

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export const MAP_CENTER: [number, number] = [
  Number(import.meta.env.VITE_MAP_CENTER_LAT ?? 12.6599),
  Number(import.meta.env.VITE_MAP_CENTER_LNG ?? 77.4512),
];
