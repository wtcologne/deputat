import { User } from '@/types/schedule';

export const USER_COLOR_PALETTE = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#14B8A6',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F472B6',
] as const;

export const INITIAL_USERS: User[] = [
  { id: 'anna', name: 'Anna', color: USER_COLOR_PALETTE[0] },
  { id: 'lukas', name: 'Lukas', color: USER_COLOR_PALETTE[3] },
  { id: 'mia', name: 'Mia', color: USER_COLOR_PALETTE[5] },
];
