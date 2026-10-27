import { z } from 'zod';

export const reportSchema = z.object({
  category: z.enum(
    [
      'electrical',
      'plumbing',
      'mechanical',
      'civil',
      'sanitation',
      'wifi',
      'hostel',
      'canteen',
      'safety',
      'other',
    ],
    { errorMap: () => ({ message: 'Select a category' }) }
  ),
  title: z.string().trim().min(5, 'At least 5 characters').max(120),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the issue in at least 10 characters')
    .max(2000),
  building: z.string().min(1, 'Select a building'),
  room: z.string().trim().min(1, 'Enter a room or location').max(100),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  lat: z.number({ required_error: 'Pick a location on the map' }),
  lng: z.number({ required_error: 'Pick a location on the map' }),
});

export type ReportForm = z.infer<typeof reportSchema>;
