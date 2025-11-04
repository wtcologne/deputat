import { Assignment } from '@/types/schedule';
import { supabase } from '@/lib/supabase';

export interface AssignmentRow {
  id: string;
  week_start_iso: string;
  day: string;
  slot_id: string;
  primary_user_id: string | null;
  created_at?: string;
}

export const assignmentsService = {
  async getByWeek(weekStartISO: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('assignments')
      .select('week_start_iso, day, slot_id, primary_user_id')
      .eq('week_start_iso', weekStartISO);

    if (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }

    return (data || []).map((row) => ({
      weekStartISO: row.week_start_iso,
      day: row.day as Assignment['day'],
      slotId: row.slot_id,
      primaryUserId: row.primary_user_id,
    }));
  },

  async setPrimary(
    weekStartISO: string,
    day: Assignment['day'],
    slotId: string,
    primaryUserId: string | null,
  ): Promise<boolean> {
    // Check if exists
    const { data: existing } = await supabase
      .from('assignments')
      .select('id')
      .eq('week_start_iso', weekStartISO)
      .eq('day', day)
      .eq('slot_id', slotId)
      .single();

    if (existing) {
      // Update if exists
      const { error } = await supabase
        .from('assignments')
        .update({ primary_user_id: primaryUserId })
        .eq('week_start_iso', weekStartISO)
        .eq('day', day)
        .eq('slot_id', slotId);

      if (error) {
        console.error('Error updating assignment:', error);
        return false;
      }
      return true;
    } else {
      // Insert if doesn't exist
      const { error } = await supabase
        .from('assignments')
        .insert({
          week_start_iso: weekStartISO,
          day,
          slot_id: slotId,
          primary_user_id: primaryUserId,
        });

      if (error) {
        console.error('Error inserting assignment:', error);
        return false;
      }
      return true;
    }
  },

  subscribe(weekStartISO: string, callback: (assignments: Assignment[]) => void) {
    return supabase
      .channel(`assignments_changes_${weekStartISO}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `week_start_iso=eq.${weekStartISO}`,
        },
        async () => {
          const assignments = await this.getByWeek(weekStartISO);
          callback(assignments);
        },
      )
      .subscribe();
  },
};

