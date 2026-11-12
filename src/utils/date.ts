/**
 * Formats ISO date or string into human-readable format.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats ISO datetime string to include time (e.g., "12 Nov 2026, 14:30").
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats time only (e.g., "14:30").
 */
export function formatTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculates hours elapsed between an ISO timestamp and now (or simulated time).
 */
export function getHoursElapsed(isoTimestamp: string, currentSimulatedTime?: string): number {
  if (!isoTimestamp) return 0;
  const start = new Date(isoTimestamp).getTime();
  const end = currentSimulatedTime ? new Date(currentSimulatedTime).getTime() : Date.now();
  if (isNaN(start) || isNaN(end)) return 0;
  return (end - start) / (1000 * 60 * 60);
}

/**
 * Formats duration elapsed into "Xh Ym" or "X mins ago".
 */
export function formatElapsed(isoTimestamp: string, currentSimulatedTime?: string): string {
  const hours = getHoursElapsed(isoTimestamp, currentSimulatedTime);
  const totalMinutes = Math.floor(hours * 60);
  if (totalMinutes < 1) return 'Just now';
  if (totalMinutes < 60) return `${totalMinutes} min${totalMinutes === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hrs}h ${mins}m ago`;
}

/**
 * Advances a YYYY-MM-DD date by a given number of days.
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
