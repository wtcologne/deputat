import { Weekday, TimeSlot } from '@/types/schedule';

export const WEEK_DAYS: Array<{ id: Weekday; label: string; shortLabel: string }> = [
  { id: 'mon', label: 'Montag', shortLabel: 'Mo' },
  { id: 'tue', label: 'Dienstag', shortLabel: 'Di' },
  { id: 'wed', label: 'Mittwoch', shortLabel: 'Mi' },
  { id: 'thu', label: 'Donnerstag', shortLabel: 'Do' },
  { id: 'fri', label: 'Freitag', shortLabel: 'Fr' },
];

export const TIME_SLOTS: TimeSlot[] = [
  { id: '08-10', label: '08:00 - 10:00', start: '08:00', end: '10:00' },
  { id: '10-12', label: '10:00 - 12:00', start: '10:00', end: '12:00' },
  { id: '12-14', label: '12:00 - 14:00', start: '12:00', end: '14:00' },
  { id: '14-16', label: '14:00 - 16:00', start: '14:00', end: '16:00' },
  { id: '16-18', label: '16:00 - 18:00', start: '16:00', end: '18:00' },
  { id: '18-20', label: '18:00 - 20:00', start: '18:00', end: '20:00' },
];
