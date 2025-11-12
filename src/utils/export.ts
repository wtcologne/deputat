import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  
  // Create worksheet data
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
  
  // Create workbook
  const wb = XLSX.utils.book_new();
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
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Stundenplan');
  
  // Generate file name
  const fileName = `Stundenplan_${weekStartISO}.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, fileName);
}

/**
 * Export schedule as PDF
 */
export async function exportToPDF(elementId: string, weekStartISO: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }
  
  try {
    // Create canvas from element
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      useCORS: true,
    } as any);
    
    const imgData = canvas.toDataURL('image/png');
    
    // Create PDF in landscape mode for better table display
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add header with title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Stundenplan', 14, 15);
    
    // Add subtitle with week
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    const date = new Date(weekStartISO);
    const formattedDate = date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    pdf.text(`Woche ab ${formattedDate}`, 14, 22);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    // Calculate image dimensions
    const margin = 14;
    const topMargin = 30;
    const availableWidth = pageWidth - (margin * 2);
    const availableHeight = pageHeight - topMargin - margin;
    
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Scale down if image is too tall
    let finalWidth = imgWidth;
    let finalHeight = imgHeight;
    
    if (imgHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
    }
    
    // Center image horizontally
    const xPosition = (pageWidth - finalWidth) / 2;
    
    // Add image
    pdf.addImage(imgData, 'PNG', xPosition, topMargin, finalWidth, finalHeight);
    
    // Download PDF
    pdf.save(`Stundenplan_${weekStartISO}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

