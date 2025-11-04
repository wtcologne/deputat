import { User } from '@/types/schedule';
import { supabase } from '@/lib/supabase';

export interface UserRow {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, color')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data || []) as User[];
  },

  async create(user: Omit<User, 'id'>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert({ name: user.name, color: user.color })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      color: data.color,
    };
  },

  subscribe(callback: (users: User[]) => void) {
    return supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        async () => {
          const users = await this.getAll();
          callback(users);
        },
      )
      .subscribe();
  },
};

