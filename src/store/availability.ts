import { create } from 'zustand';

import { Availability, Weekday } from '@/types/schedule';
import { availabilityService } from '@/services/supabase/availability';

interface AvailabilityState {
  availabilityByWeek: Map<string, Availability[]>;
  availabilityVersion: number;
  isLoading: boolean;
  error: string | null;
  subscriptions: Map<string, ReturnType<typeof availabilityService.subscribe>>;
  getWeekAvailability: (weekStartISO: string) => Availability[];
  loadWeekAvailability: (weekStartISO: string) => Promise<void>;
  toggleAvailability: (
    userId: string,
    weekStartISO: string,
    day: Weekday,
    slotId: string,
  ) => Promise<void>;
  setUserWeekAvailability: (
    userId: string,
    weekStartISO: string,
    availabilityEntries: Array<{ day: Weekday; slotId: string }>,
  ) => Promise<void>;
  subscribeToWeek: (weekStartISO: string) => void;
  unsubscribeFromWeek: (weekStartISO: string) => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  availabilityByWeek: new Map<string, Availability[]>(),
  availabilityVersion: 0,
  isLoading: false,
  error: null,
  subscriptions: new Map(),

  getWeekAvailability: (weekStartISO: string) => {
    const current = get().availabilityByWeek.get(weekStartISO);
    return current ? [...current] : [];
  },

  loadWeekAvailability: async (weekStartISO: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const availability = await availabilityService.getByWeek(weekStartISO);
      const map = new Map(get().availabilityByWeek);
      map.set(weekStartISO, availability);
      set({ 
        availabilityByWeek: map, 
        availabilityVersion: get().availabilityVersion + 1,
        isLoading: false,
        error: null 
      });
    } catch (error) {
      console.error('Failed to load availability:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to load availability. Please try again.' 
      });
    }
  },

  subscribeToWeek: (weekStartISO: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    const subscriptions = get().subscriptions;
    if (subscriptions.has(weekStartISO)) {
      return; // Already subscribed
    }

    const subscription = availabilityService.subscribe(weekStartISO, (availability) => {
      const map = new Map(get().availabilityByWeek);
      map.set(weekStartISO, availability);
      set({ 
        availabilityByWeek: map, 
        availabilityVersion: get().availabilityVersion + 1 
      });
    });

    subscriptions.set(weekStartISO, subscription);
    set({ subscriptions: new Map(subscriptions) });
  },

  unsubscribeFromWeek: (weekStartISO: string) => {
    const subscriptions = get().subscriptions;
    const subscription = subscriptions.get(weekStartISO);
    if (subscription) {
      subscription.unsubscribe();
      subscriptions.delete(weekStartISO);
      set({ subscriptions: new Map(subscriptions) });
    }
  },

  toggleAvailability: async (userId, weekStartISO, day, slotId) => {
    if (typeof window === 'undefined') {
      return;
    }

    set({ error: null });
    try {
      const success = await availabilityService.toggle(userId, weekStartISO, day, slotId);
      if (success) {
        // Reload the week to get updated data
        await get().loadWeekAvailability(weekStartISO);
      } else {
        throw new Error('Failed to toggle availability');
      }
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      set({ error: 'Failed to update availability. Please try again.' });
    }
  },

  setUserWeekAvailability: async (userId, weekStartISO, availabilityEntries) => {
    if (typeof window === 'undefined') {
      return;
    }

    set({ error: null });
    try {
      const success = await availabilityService.setUserWeek(userId, weekStartISO, availabilityEntries);
      if (success) {
        // Reload the week to get updated data
        await get().loadWeekAvailability(weekStartISO);
      } else {
        throw new Error('Failed to set user week availability');
      }
    } catch (error) {
      console.error('Failed to set user week availability:', error);
      set({ error: 'Failed to save availability. Please try again.' });
    }
  },
}));
