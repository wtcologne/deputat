import { create } from 'zustand';

import { Assignment, Weekday } from '@/types/schedule';
import { assignmentsService } from '@/services/supabase/assignments';

interface AssignmentsState {
  assignmentsByWeek: Map<string, Assignment[]>;
  isLoading: boolean;
  error: string | null;
  subscriptions: Map<string, ReturnType<typeof assignmentsService.subscribe>>;
  getWeekAssignments: (weekStartISO: string) => Assignment[];
  loadWeekAssignments: (weekStartISO: string) => Promise<void>;
  setPrimaryAssignment: (
    weekStartISO: string,
    day: Weekday,
    slotId: string,
    primaryUserId: string | null,
  ) => Promise<void>;
  subscribeToWeek: (weekStartISO: string) => void;
  unsubscribeFromWeek: (weekStartISO: string) => void;
}

export const useAssignmentsStore = create<AssignmentsState>((set, get) => ({
  assignmentsByWeek: new Map<string, Assignment[]>(),
  isLoading: false,
  error: null,
  subscriptions: new Map(),

  getWeekAssignments: (weekStartISO: string) => {
    const current = get().assignmentsByWeek.get(weekStartISO);
    return current ? [...current] : [];
  },

  loadWeekAssignments: async (weekStartISO: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const assignments = await assignmentsService.getByWeek(weekStartISO);
      const map = new Map(get().assignmentsByWeek);
      map.set(weekStartISO, assignments);
      set({ assignmentsByWeek: map, isLoading: false, error: null });
    } catch (error) {
      console.error('Failed to load assignments:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to load assignments. Please try again.' 
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

    const subscription = assignmentsService.subscribe(weekStartISO, (assignments) => {
      const map = new Map(get().assignmentsByWeek);
      map.set(weekStartISO, assignments);
      set({ assignmentsByWeek: map });
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

  setPrimaryAssignment: async (weekStartISO, day, slotId, primaryUserId) => {
    if (typeof window === 'undefined') {
      return;
    }

    set({ error: null });
    try {
      const success = await assignmentsService.setPrimary(weekStartISO, day, slotId, primaryUserId);
      if (success) {
        // Reload the week to get updated data
        await get().loadWeekAssignments(weekStartISO);
      } else {
        throw new Error('Failed to set primary assignment');
      }
    } catch (error) {
      console.error('Failed to set primary assignment:', error);
      set({ error: 'Failed to update assignment. Please try again.' });
    }
  },
}));
