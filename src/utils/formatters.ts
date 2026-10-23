/**
 * Formats seconds into mm:ss or hh:mm:ss
 */
export function formatTime(seconds?: number): string {
  if (seconds === undefined || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }

  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;

  if (hours > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hours}:${paddedMins}:${paddedSecs}`;
  }

  return `${mins}:${paddedSecs}`;
}

/**
 * Formats numbers into compact K/M (e.g. 14.2K, 1.2M)
 */
export function formatNumber(num?: number): string {
  if (!num) return '0';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

/**
 * Formats ISO date to readable string (e.g. "Oct 2024")
 */
export function formatDate(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}
