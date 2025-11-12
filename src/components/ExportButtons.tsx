"use client";

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { exportToExcel, exportToPDF } from '@/utils/export';
import { useAvailabilityStore } from '@/store/availability';
import { useUsersStore } from '@/store/users';

interface ExportButtonsProps {
  weekStartISO: string;
  gridElementId: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ weekStartISO, gridElementId }) => {
  const [isExporting, setIsExporting] = useState(false);
  const users = useUsersStore((state) => state.users);
  const availabilityByWeek = useAvailabilityStore((state) => state.availabilityByWeek);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const availability = availabilityByWeek.get(weekStartISO) ?? [];
      await exportToExcel({
        weekStartISO,
        availability,
        users,
      });
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Export fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(gridElementId, weekStartISO);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Export fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={handleExportExcel}
        disabled={isExporting}
        className="group flex items-center justify-center gap-2 rounded-full border border-slate-200/60 bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:border-emerald-300/60 hover:bg-emerald-50/70 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            <span>Exportiere...</span>
          </>
        ) : (
          <>
            <ArrowDownTrayIcon className="h-5 w-5 transition group-hover:scale-110" />
            <span>Excel exportieren</span>
          </>
        )}
      </button>

      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className="group flex items-center justify-center gap-2 rounded-full border border-slate-200/60 bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-300/60 hover:bg-blue-50/70 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            <span>Exportiere...</span>
          </>
        ) : (
          <>
            <ArrowDownTrayIcon className="h-5 w-5 transition group-hover:scale-110" />
            <span>PDF exportieren</span>
          </>
        )}
      </button>
    </div>
  );
};

