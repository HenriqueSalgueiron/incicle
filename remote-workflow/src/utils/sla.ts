export type SlaStatus = 'ok' | 'warning' | 'breached';

const WARNING_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function getTimeRemaining(deadline: string): TimeRemaining {
  const totalMs = new Date(deadline).getTime() - Date.now();

  if (totalMs <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalMs };
  }

  const hours = Math.floor(totalMs / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, totalMs };
}

export function getSlaStatus(deadline: string): SlaStatus {
  const { totalMs } = getTimeRemaining(deadline);

  if (totalMs <= 0) return 'breached';
  if (totalMs <= WARNING_THRESHOLD_MS) return 'warning';
  return 'ok';
}

export function formatTimeRemaining(remaining: TimeRemaining): string {
  if (remaining.totalMs <= 0) return 'Expirado';

  const parts: string[] = [];
  if (remaining.hours > 0) parts.push(`${remaining.hours}h`);
  if (remaining.minutes > 0 || remaining.hours > 0) parts.push(`${remaining.minutes}m`);
  parts.push(`${remaining.seconds}s`);

  return parts.join(' ');
}
