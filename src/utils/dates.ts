import { WEEK_DAYS } from '@/constants/schedule';
import { Weekday } from '@/types/schedule';

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

export const getWeekStartISO = (reference: Date = new Date()): string => {
  const date = new Date(reference);
  const day = date.getDay();
  const distanceToMonday = (day + 6) % 7;
  date.setDate(date.getDate() - distanceToMonday);
  date.setHours(0, 0, 0, 0);
  return toISODate(date);
};

export const shiftWeek = (weekStartISO: string, offset: number): string => {
  const date = new Date(weekStartISO);
  date.setDate(date.getDate() + offset * 7);
  return toISODate(date);
};

export const formatWeekHeading = (weekStartISO: string): string => {
  const date = new Date(weekStartISO);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getWeekdayLabel = (day: Weekday): string => {
  const match = WEEK_DAYS.find((weekday) => weekday.id === day);
  return match?.label ?? day;
};
