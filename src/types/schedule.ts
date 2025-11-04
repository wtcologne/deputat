export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export interface TimeSlot {
  id: string;
  label: string;
  start: string;
  end: string;
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface Availability {
  userId: string;
  weekStartISO: string;
  day: Weekday;
  slotId: string;
}

export interface Assignment {
  weekStartISO: string;
  day: Weekday;
  slotId: string;
  primaryUserId: string | null;
}
