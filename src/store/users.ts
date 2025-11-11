import { create } from 'zustand';

import { USER_COLOR_PALETTE, INITIAL_USERS } from '@/constants/users';
import { User } from '@/types/schedule';
import { usersService } from '@/services/supabase/users';

const pickNextColor = (existingUsers: User[]): string => {
  const usedColors = new Set(existingUsers.map((user) => user.color));
  for (const color of USER_COLOR_PALETTE) {
    if (!usedColors.has(color)) {
      return color;
    }
  }

  return USER_COLOR_PALETTE[existingUsers.length % USER_COLOR_PALETTE.length];
};

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  addUser: (name: string) => Promise<void>;
  loadUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  isLoading: true,
  error: null,
  
  loadUsers: async () => {
    if (typeof window === 'undefined') {
      set({ users: [], isLoading: false });
      return;
    }

    // Prevent multiple simultaneous loads
    const currentState = get();
    if (currentState.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const users = await usersService.getAll();
      // Start with empty list - users must register themselves
      set({ users, isLoading: false, error: null });
    } catch (error) {
      console.error('Failed to load users:', error);
      set({ 
        users: [], 
        isLoading: false, 
        error: 'Failed to load users from Supabase. Please check your connection.' 
      });
    }
  },

  addUser: async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const currentUsers = get().users;
    const color = pickNextColor(currentUsers);

    set({ error: null });
    try {
      const newUser = await usersService.create({ name: trimmedName, color });
      if (newUser) {
        set({ users: [...currentUsers, newUser] });
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      set({ error: 'Failed to add user. Please try again.' });
    }
  },
}));

// Initialize and subscribe to real-time updates
if (typeof window !== 'undefined') {
  const store = useUsersStore.getState();
  store.loadUsers();

  // Subscribe to real-time changes
  usersService.subscribe((users) => {
    useUsersStore.setState({ users });
  });
}
