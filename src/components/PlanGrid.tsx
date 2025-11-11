"use client";

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import { TIME_SLOTS, WEEK_DAYS } from '@/constants/schedule';
import { useAvailabilityStore } from '@/store/availability';
import { useUsersStore } from '@/store/users';
import { Weekday } from '@/types/schedule';

import { UserBadge } from './UserBadge';

interface PlanGridProps {
  weekStartISO: string;
  className?: string;
}

type SlotKey = `${Weekday}-${string}`;

export const PlanGrid: React.FC<PlanGridProps> = ({ weekStartISO, className }) => {
  const users = useUsersStore((state) => state.users);
  const availabilityVersion = useAvailabilityStore((state) => state.availabilityVersion);
  const availabilityByWeek = useAvailabilityStore((state) => state.availabilityByWeek);
  const loadWeekAvailability = useAvailabilityStore((state) => state.loadWeekAvailability);
  const subscribeToWeek = useAvailabilityStore((state) => state.subscribeToWeek);
  const unsubscribeFromWeek = useAvailabilityStore((state) => state.unsubscribeFromWeek);
  const isLoading = useAvailabilityStore((state) => state.isLoading);
  
  // Track mounted state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    // Load data and subscribe to real-time updates
    loadWeekAvailability(weekStartISO);
    subscribeToWeek(weekStartISO);
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribeFromWeek(weekStartISO);
    };
  }, [weekStartISO, loadWeekAvailability, subscribeToWeek, unsubscribeFromWeek]);
  
  // Extract week-specific data with useMemo to avoid creating new references on every render
  const availability = useMemo(() => {
    const current = availabilityByWeek.get(weekStartISO);
    return current ? [...current] : [];
  }, [availabilityByWeek, weekStartISO, availabilityVersion]);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const availabilityBySlot = useMemo(() => {
    const map = new Map<SlotKey, typeof users>();

    console.log('🔍 PlanGrid Debug:', {
      weekStartISO,
      availabilityCount: availability.length,
      usersCount: users.length,
      availability: availability,
      users: users,
    });

    availability.forEach((entry) => {
      const user = usersById.get(entry.userId);
      if (!user) {
        console.warn('⚠️ User not found for availability entry:', entry);
        return;
      }

      const key = `${entry.day}-${entry.slotId}` as SlotKey;
      const list = map.get(key) ?? [];
      map.set(key, [...list, user]);
    });

    console.log('📊 Availability by slot:', map);

    return map;
  }, [availability, usersById, weekStartISO, users]);

  return (
    <div className={clsx('rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-md', className)}>
      <table className="w-full table-fixed border-spacing-4">
        <thead>
          <tr>
            <th className="w-28 px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Zeit
            </th>
            {WEEK_DAYS.map((day) => (
              <th key={day.id} className="px-2 py-3 text-sm font-semibold text-slate-700">
                {day.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          {TIME_SLOTS.map((slot) => (
            <tr key={slot.id} className="align-top">
              <th className="px-2 py-3 text-left text-sm font-semibold text-slate-600">
                {slot.label}
              </th>
              {WEEK_DAYS.map((day) => {
                const key = `${day.id}-${slot.id}` as SlotKey;
                const slotUsers = availabilityBySlot.get(key) ?? [];
                // During SSR/initial hydration, treat as empty to prevent mismatch
                const isEmpty = !isMounted || slotUsers.length === 0;

                return (
                  <td key={day.id} className="px-2 py-3">
                    <div
                      className={clsx(
                        'flex min-h-36 flex-col justify-between rounded-2xl border px-3 py-3 shadow-sm backdrop-blur transition',
                        isEmpty
                          ? 'border-rose-200/70 bg-rose-50/80 text-rose-600'
                          : 'border-slate-200/70 bg-white/60 text-slate-600',
                      )}
                    >
                      <div className="flex flex-wrap gap-2">
                        {!isMounted ? (
                          // Render placeholder during SSR and initial hydration to prevent mismatch
                          <span className="text-sm font-medium">frei</span>
                        ) : slotUsers.length > 0 ? (
                          slotUsers.map((user) => (
                            <UserBadge
                              key={user.id}
                              name={user.name}
                              color={user.color}
                              className="text-xs"
                            />
                          ))
                        ) : (
                          <span className="text-sm font-medium">frei</span>
                        )}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
