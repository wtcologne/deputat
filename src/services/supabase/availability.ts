import { Availability } from '@/types/schedule';
import { supabase } from '@/lib/supabase';

export interface AvailabilityRow {
  id: string;
  user_id: string;
  week_start_iso: string;
  day: string;
  slot_id: string;
  created_at?: string;
}

export const availabilityService = {
  async getByWeek(weekStartISO: string): Promise<Availability[]> {
    console.log('🔍 Fetching availability for week:', weekStartISO);
    
    const { data, error } = await supabase
      .from('availability')
      .select('user_id, week_start_iso, day, slot_id')
      .eq('week_start_iso', weekStartISO);

    if (error) {
      console.error('❌ Error fetching availability:', error);
      return [];
    }

    console.log('✅ Availability data fetched:', {
      weekStartISO,
      rowCount: data?.length || 0,
      data: data,
    });

    return (data || []).map((row) => ({
      userId: row.user_id,
      weekStartISO: row.week_start_iso,
      day: row.day as Availability['day'],
      slotId: row.slot_id,
    }));
  },

  async toggle(userId: string, weekStartISO: string, day: Availability['day'], slotId: string): Promise<boolean> {
    // First check if exists - use maybeSingle() instead of single() to handle no rows
    const { data: existing, error: checkError } = await supabase
      .from('availability')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start_iso', weekStartISO)
      .eq('day', day)
      .eq('slot_id', slotId)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected
      console.error('Error checking availability:', checkError);
      return false;
    }

    if (existing) {
      // Delete if exists
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('user_id', userId)
        .eq('week_start_iso', weekStartISO)
        .eq('day', day)
        .eq('slot_id', slotId);

      if (error) {
        console.error('Error deleting availability:', error);
        console.error('Error details:', {
          userId,
          weekStartISO,
          day,
          slotId,
          errorCode: error.code,
          errorMessage: error.message,
        });
        return false;
      }
      return true;
    } else {
      // Insert if doesn't exist
      const { error } = await supabase
        .from('availability')
        .insert({
          user_id: userId,
          week_start_iso: weekStartISO,
          day,
          slot_id: slotId,
        });

      if (error) {
        console.error('Error inserting availability:', error);
        console.error('Error details:', {
          userId,
          weekStartISO,
          day,
          slotId,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
        });
        return false;
      }
      return true;
    }
  },

  async setUserWeek(
    userId: string,
    weekStartISO: string,
    entries: Array<{ day: Availability['day']; slotId: string }>,
  ): Promise<boolean> {
    // Delete all existing availability for this user and week
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('user_id', userId)
      .eq('week_start_iso', weekStartISO);

    if (deleteError) {
      console.error('Error deleting user week availability:', deleteError);
      return false;
    }

    // Insert new entries
    if (entries.length > 0) {
      const rows = entries.map((entry) => ({
        user_id: userId,
        week_start_iso: weekStartISO,
        day: entry.day,
        slot_id: entry.slotId,
      }));

      const { error: insertError } = await supabase.from('availability').insert(rows);

      if (insertError) {
        console.error('Error inserting user week availability:', insertError);
        return false;
      }
    }

    return true;
  },

  subscribe(weekStartISO: string, callback: (availability: Availability[]) => void) {
    return supabase
      .channel(`availability_changes_${weekStartISO}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability',
          filter: `week_start_iso=eq.${weekStartISO}`,
        },
        async () => {
          const availability = await this.getByWeek(weekStartISO);
          callback(availability);
        },
      )
      .subscribe();
  },
};

