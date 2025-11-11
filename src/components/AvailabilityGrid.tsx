"use client";

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import { TIME_SLOTS, WEEK_DAYS } from '@/constants/schedule';
import { getReadableTextColor } from '@/utils/colors';
import { useAvailabilityStore } from '@/store/availability';
import { useUsersStore } from '@/store/users';
import { Weekday } from '@/types/schedule';

interface AvailabilityGridProps {
  weekStartISO: string;
  currentUserId: string | null;
  className?: string;
}

export const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  weekStartISO,
  currentUserId,
  className,
}) => {
  const currentUser = useUsersStore((state) =>
    state.users.find((user) => user.id === (currentUserId ?? '')),
  );
  const usersIsLoading = useUsersStore((state) => state.isLoading);
  const loadUsers = useUsersStore((state) => state.loadUsers);
  const toggleAvailability = useAvailabilityStore((state) => state.toggleAvailability);
  const availabilityVersion = useAvailabilityStore((state) => state.availabilityVersion);
  const availabilityByWeek = useAvailabilityStore((state) => state.availabilityByWeek);
  const loadWeekAvailability = useAvailabilityStore((state) => state.loadWeekAvailability);
  const subscribeToWeek = useAvailabilityStore((state) => state.subscribeToWeek);
  const unsubscribeFromWeek = useAvailabilityStore((state) => state.unsubscribeFromWeek);
  const isLoading = useAvailabilityStore((state) => state.isLoading);
  const error = useAvailabilityStore((state) => state.error);
  
  const [isToggling, setIsToggling] = useState(false);
  
  // Extract week-specific data with useMemo to avoid creating new references on every render
  const weekAvailability = useMemo(() => {
    const current = availabilityByWeek.get(weekStartISO);
    return current ? [...current] : [];
  }, [availabilityByWeek, weekStartISO, availabilityVersion]);

  const userAvailabilityKeys = useMemo(() => {
    if (!currentUserId) {
      return new Set<string>();
    }

    return new Set(
      weekAvailability
        .filter((entry) => entry.userId === currentUserId)
        .map((entry) => `${entry.day}-${entry.slotId}`),
    );
  }, [currentUserId, weekAvailability]);

  useEffect(() => {
    // Ensure users are loaded first
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    // Only load availability data after users are loaded
    if (!usersIsLoading) {
      loadWeekAvailability(weekStartISO);
      subscribeToWeek(weekStartISO);
    }
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribeFromWeek(weekStartISO);
    };
  }, [weekStartISO, loadWeekAvailability, subscribeToWeek, unsubscribeFromWeek, usersIsLoading]);

  const handleToggle = async (day: Weekday, slotId: string) => {
    if (!currentUserId || isToggling) {
      return;
    }

    setIsToggling(true);
    try {
      await toggleAvailability(currentUserId, weekStartISO, day, slotId);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className={clsx('rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-md', className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Verfügbarkeit auswählen</h3>
        <p className="text-sm text-slate-500">
          Änderungen werden sofort gespeichert. Klicke einfach auf die Zeitblöcke, die für dich passen.
        </p>
        {error && (
          <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="mt-2 text-sm text-slate-500">Lade Verfügbarkeiten...</div>
        )}
      </div>

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
            <tr key={slot.id} className="align-middle">
              <th className="px-2 py-2 text-left text-sm font-medium text-slate-600">
                {slot.label}
              </th>
              {WEEK_DAYS.map((day) => {
                const key = `${day.id}-${slot.id}`;
                const isActive = userAvailabilityKeys.has(key);
                const textColor = currentUser ? getReadableTextColor(currentUser.color) : 'white';

                return (
                  <td key={day.id} className="px-2 py-2">
                    <button
                      type="button"
                      disabled={!currentUserId || isToggling || isLoading}
                      aria-pressed={isActive}
                      onClick={() => handleToggle(day.id, slot.id)}
                      className={clsx(
                        'flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl border px-3 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2',
                        isActive
                          ? 'border-transparent'
                          : 'border-slate-200/70 bg-white/60 text-slate-500 hover:bg-white/80',
                        (!currentUserId || isToggling || isLoading) ? 'cursor-not-allowed opacity-60' : 'backdrop-blur',
                      )}
                      style={
                        isActive && currentUser
                          ? {
                              backgroundColor: currentUser.color,
                              color: textColor,
                            }
                          : undefined
                      }
                    >
                      <span>{isActive ? 'Ich kann' : 'Frei'}</span>
                      <span className="text-xs font-normal opacity-80">{slot.label}</span>
                    </button>
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
