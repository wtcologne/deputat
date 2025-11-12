"use client";

import { PlanGrid } from '@/components/PlanGrid';
import { ExportButtons } from '@/components/ExportButtons';

export default function PlanPage() {
  // Fixed week - always show the week of November 2, 2025
  const weekStartISO = '2025-11-02';
  const gridId = 'plan-grid-export';

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/70 p-6 shadow-md backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-800">Wochenplan Übersicht</h2>
            <p className="mt-2 text-sm text-slate-500">
              Welche Lehrbereitschaften sind aktuell vorhanden? Hier siehst du alle verfügbaren
              Zeitblöcke und kannst freie Slots erkennen.
            </p>
          </div>
          <ExportButtons weekStartISO={weekStartISO} gridElementId={gridId} />
        </div>
      </section>

      <PlanGrid weekStartISO={weekStartISO} id={gridId} />
    </div>
  );
}
