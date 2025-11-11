"use client";

import { useState, useMemo } from 'react';

import { PlanGrid } from '@/components/PlanGrid';
import { WeekSelector } from '@/components/WeekSelector';
import { getWeekStartISO } from '@/utils/dates';

export default function PlanPage() {
  // Memoize to avoid hydration mismatch - calculate once per mount
  const initialWeekStartISO = useMemo(() => getWeekStartISO(), []);
  const [weekStartISO, setWeekStartISO] = useState(initialWeekStartISO);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-md backdrop-blur">
        <h2 className="text-xl font-semibold text-slate-800">Wochenplan Übersicht</h2>
        <p className="text-sm text-slate-500">
          Welche Lehrbereitschaften sind aktuell vorhanden? Hier siehst du alle verfügbaren
          Zeitblöcke und kannst freie Slots erkennen.
        </p>
      </section>

      <WeekSelector weekStartISO={weekStartISO} onChange={setWeekStartISO} />

      <PlanGrid weekStartISO={weekStartISO} />
    </div>
  );
}
