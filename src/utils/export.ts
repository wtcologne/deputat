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

/**
 * Normalize styles in cloned element to convert oklab/oklch to RGB
 * This function is called in the onclone callback, so we need to work with the cloned document
 */
function normalizeStylesForPDF(clonedElement: HTMLElement, originalElement: HTMLElement): void {
  // Get all elements from both original and cloned
  const originalElements = [originalElement, ...Array.from(originalElement.querySelectorAll('*'))];
  const clonedElements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))];
  
  // Match elements by their structure/index
  originalElements.forEach((originalEl, index) => {
    const clonedEl = clonedElements[index] as HTMLElement;
    if (!clonedEl || !originalEl) return;
    
    try {
      // Get computed styles from the original element
      const computedStyle = window.getComputedStyle(originalEl as Element);
      
      // Helper to convert any color to RGB
      const convertToRGB = (colorValue: string): string | null => {
        if (!colorValue || colorValue === 'transparent' || colorValue === 'rgba(0, 0, 0, 0)') {
          return null;
        }
        
        // Already RGB format
        if (colorValue.startsWith('rgb')) return colorValue;
        
        // HEX format
        if (colorValue.startsWith('#')) return colorValue;
        
        // Modern color formats (oklab, oklch) - render to get RGB
        if (colorValue.includes('oklab') || colorValue.includes('oklch') || colorValue.includes('color(')) {
          try {
            // Create a temporary element in the original document to get rendered color
            const temp = document.createElement('span');
            temp.style.setProperty('color', colorValue, 'important');
            temp.style.position = 'absolute';
            temp.style.visibility = 'hidden';
            temp.style.width = '1px';
            temp.style.height = '1px';
            document.body.appendChild(temp);
            
            const rendered = window.getComputedStyle(temp).color;
            document.body.removeChild(temp);
            
            if (rendered && rendered.startsWith('rgb')) {
              return rendered;
            }
          } catch (e) {
            // Ignore conversion errors
          }
        }
        
        return null;
      };
      
      // Convert and apply background color
      const bgColor = computedStyle.backgroundColor;
      if (bgColor) {
        const rgb = convertToRGB(bgColor);
        if (rgb) {
          clonedEl.style.backgroundColor = rgb;
        } else if (!bgColor.includes('oklab') && !bgColor.includes('oklch')) {
          clonedEl.style.backgroundColor = bgColor;
        }
      }
      
      // Convert and apply text color
      const textColor = computedStyle.color;
      if (textColor) {
        const rgb = convertToRGB(textColor);
        if (rgb) {
          clonedEl.style.color = rgb;
        } else if (!textColor.includes('oklab') && !textColor.includes('oklch')) {
          clonedEl.style.color = textColor;
        }
      }
      
      // Convert and apply border color
      const borderColor = computedStyle.borderColor;
      if (borderColor && borderColor !== 'transparent' && borderColor !== 'rgba(0, 0, 0, 0)') {
        const rgb = convertToRGB(borderColor);
        if (rgb) {
          clonedEl.style.borderColor = rgb;
        } else if (!borderColor.includes('oklab') && !borderColor.includes('oklch')) {
          clonedEl.style.borderColor = borderColor;
        }
      }
    } catch (e) {
      // Silently ignore errors for individual elements
    }
  });
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
    // Create canvas from element with onclone callback to normalize styles
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      useCORS: true,
      scale: 1,
      logging: false,
      onclone: (clonedDoc: Document) => {
        // Find the cloned element in the cloned document
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          normalizeStylesForPDF(clonedElement as HTMLElement, element);
        }
      },
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

