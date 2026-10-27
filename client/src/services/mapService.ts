import { api } from './api';
import type { HeatPoint, MapReport } from '../types';

export const mapService = {
  reports: (categories: string[], includeResolved = false) =>
    api
      .get<{ data: MapReport[] }>('/map/reports', {
        params: {
          categories: categories.length ? categories.join(',') : undefined,
          includeResolved: includeResolved ? 'true' : 'false',
        },
      })
      .then((r) => r.data.data),
  heat: (categories: string[], includeResolved = false) =>
    api
      .get<{ data: HeatPoint[] }>('/map/heat', {
        params: {
          categories: categories.length ? categories.join(',') : undefined,
          includeResolved: includeResolved ? 'true' : 'false',
        },
      })
      .then((r) => r.data.data),
};
