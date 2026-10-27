import { api } from './api';
import type { Building } from '../types';

export const buildingService = {
  list: () => api.get<{ data: Building[] }>('/buildings').then((r) => r.data.data),
};
