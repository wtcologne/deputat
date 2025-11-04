"use client";

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useCallback } from 'react';

import { formatWeekHeading, shiftWeek } from '@/utils/dates';

interface WeekSelectorProps {
  weekStartISO: string;
  onChange: (nextWeekStartISO: string) => void;
  className?: string;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  weekStartISO,
  onChange,
  className,
}) => {
  const goToPreviousWeek = useCallback(() => {
    onChange(shiftWeek(weekStartISO, -1));
  }, [onChange, weekStartISO]);

  const goToNextWeek = useCallback(() => {
    onChange(shiftWeek(weekStartISO, 1));
  }, [onChange, weekStartISO]);

  return (
    <div
      className={clsx(
        'flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur',
        className,
      )}
    >
      <button
        type="button"
        onClick={goToPreviousWeek}
        className="inline-flex items-center gap-1 rounded-xl border border-transparent bg-white/60 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Vorherige Woche
      </button>

      <div className="text-center text-sm uppercase tracking-wide text-slate-500">
        Woche ab{' '}
        <span className="text-lg font-semibold text-slate-800">
          {formatWeekHeading(weekStartISO)}
        </span>
      </div>

      <button
        type="button"
        onClick={goToNextWeek}
        className="inline-flex items-center gap-1 rounded-xl border border-transparent bg-white/60 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
      >
        Nächste Woche
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
