/**
 * Converts a database date (which may be a Date object in UTC or a string)
 * to a YYYY-MM-DD string representing the date in the Europe/Brussels timezone.
 * 
 * This ensures consistent date handling regardless of server timezone.
 */
export function toLocalDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to Europe/Brussels timezone (CET/CEST)
  // Use Intl.DateTimeFormat for proper timezone conversion
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return formatter.format(d);
}

/**
 * Gets today's date as YYYY-MM-DD in the Europe/Brussels timezone
 */
export function getTodayString(): string {
  return toLocalDateString(new Date());
}

/**
 * Calculates the difference in days between two date strings (YYYY-MM-DD format)
 */
export function daysDiff(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str + 'T00:00:00');
  const d2 = new Date(date2Str + 'T00:00:00');
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}
