import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  Map,
  ScrollText,
  Users,
  FileText,
  User,
  PlusSquare,
  BookOpen,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { Role } from '../types';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles?: Role[];
  end?: boolean;
}

export const studentNav: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/report', label: 'Report Issue', icon: PlusSquare },
  { to: '/map', label: 'Campus Map', icon: Map },
  { to: '/complaints', label: 'My Complaints', icon: FileText },
  { to: '/profile', label: 'Profile', icon: User },
];

export const adminNav: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
  { to: '/admin/reports', label: 'Reports', icon: ClipboardList },
  { to: '/admin/map', label: 'Map', icon: Map },
  { to: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/admin/buildings', label: 'Buildings', icon: Building2, roles: ['admin'] },
  { to: '/admin/knowledge', label: 'Knowledge Base', icon: BookOpen, roles: ['admin'] },
  { to: '/admin/audit', label: 'Audit Log', icon: ScrollText, roles: ['admin'] },
  { to: '/profile', label: 'Profile', icon: User },
];

