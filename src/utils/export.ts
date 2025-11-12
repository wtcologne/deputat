import * as XLSX from 'xlsx';
import { TIME_SLOTS, WEEK_DAYS } from '@/constants/schedule';
import { User, Availability } from '@/types/schedule';

interface ExportData {
  weekStartISO: string;
  availability: Availability[];
  users: User[];
}

type SlotKey = `${string}-${string}`;

/**
 * Export schedule as Excel file
 */
export async function exportToExcel(data: ExportData): Promise<void> {
  const { weekStartISO, availability, users } = data;
  
  // Create a map of user IDs to user names
  const usersById = new Map(users.map(user => [user.id, user]));
  
  // Create availability map
  const availabilityMap = new Map<SlotKey, User[]>();
  
  availability.forEach(entry => {
    const user = usersById.get(entry.userId);
    if (user) {
      const key = `${entry.day}-${entry.slotId}` as SlotKey;
      const list = availabilityMap.get(key) ?? [];
      availabilityMap.set(key, [...list, user]);
    }
  });
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // ===== WORKSHEET 1: Stundenplan =====
  const wsData: (string | number)[][] = [];
  
  // Header row
  const headerRow = ['Zeit', ...WEEK_DAYS.map(day => day.label)];
  wsData.push(headerRow);
  
  // Data rows
  TIME_SLOTS.forEach(slot => {
    const row = [slot.label];
    
    WEEK_DAYS.forEach(day => {
      const key = `${day.id}-${slot.id}` as SlotKey;
      const slotUsers = availabilityMap.get(key) ?? [];
      const cellValue = slotUsers.length > 0 
        ? slotUsers.map(u => u.name).join(', ')
        : 'frei';
      row.push(cellValue);
    });
    
    wsData.push(row);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Stundenplan');
  
  // ===== WORKSHEET 2: Verfügbarkeiten nach Usern =====
  const userData: (string | number)[][] = [];
  
  // Header row
  userData.push(['User', 'Tag', 'Zeitslot', 'Von', 'Bis']);
  
  // Sort users by name for consistent ordering
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));
  
  // Group availability by user
  sortedUsers.forEach(user => {
    const userAvailability = availability
      .filter(entry => entry.userId === user.id)
      .sort((a, b) => {
        // Sort by day first
        const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri'];
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        // Then by slot
        return a.slotId.localeCompare(b.slotId);
      });
    
    if (userAvailability.length === 0) {
      // Show user with no availability
      userData.push([user.name, '-', '-', '-', '-']);
    } else {
      userAvailability.forEach(entry => {
        const dayLabel = WEEK_DAYS.find(d => d.id === entry.day)?.label || entry.day;
        const slot = TIME_SLOTS.find(s => s.id === entry.slotId);
        const timeFrom = slot?.start || '-';
        const timeTo = slot?.end || '-';
        
        userData.push([
          user.name,
          dayLabel,
          slot?.label || entry.slotId,
          timeFrom,
          timeTo,
        ]);
      });
    }
    
    // Add empty row between users for better readability
    if (user !== sortedUsers[sortedUsers.length - 1]) {
      userData.push(['', '', '', '', '']);
    }
  });
  
  const ws2 = XLSX.utils.aoa_to_sheet(userData);
  
  // Set column widths
  ws2['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
  ];
  
  XLSX.utils.book_append_sheet(wb, ws2, 'Verfügbarkeiten');
  
  // Generate file name
  const fileName = `Stundenplan_${weekStartISO}.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, fileName);
}

