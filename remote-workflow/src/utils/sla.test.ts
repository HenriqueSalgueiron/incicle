import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTimeRemaining, getSlaStatus, formatTimeRemaining } from './sla';

describe('SLA utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-30T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTimeRemaining', () => {
    it('returns positive breakdown for future deadline', () => {
      // 5h 30m 15s from now
      const deadline = new Date('2026-03-30T17:30:15Z').toISOString();
      const result = getTimeRemaining(deadline);

      expect(result.hours).toBe(5);
      expect(result.minutes).toBe(30);
      expect(result.seconds).toBe(15);
      expect(result.totalMs).toBeGreaterThan(0);
    });

    it('returns zeroed fields with negative totalMs for past deadline', () => {
      const deadline = new Date('2026-03-30T11:00:00Z').toISOString();
      const result = getTimeRemaining(deadline);

      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
      expect(result.totalMs).toBeLessThan(0);
    });
  });

  describe('getSlaStatus', () => {
    it('returns "ok" when more than 4h remain', () => {
      const deadline = new Date('2026-03-30T17:00:00Z').toISOString(); // 5h
      expect(getSlaStatus(deadline)).toBe('ok');
    });

    it('returns "warning" when 0 < remaining <= 4h', () => {
      const deadline = new Date('2026-03-30T14:00:00Z').toISOString(); // 2h
      expect(getSlaStatus(deadline)).toBe('warning');
    });

    it('returns "breached" when past deadline', () => {
      const deadline = new Date('2026-03-30T11:00:00Z').toISOString(); // -1h
      expect(getSlaStatus(deadline)).toBe('breached');
    });

    it('returns "warning" at exactly 4h boundary', () => {
      const deadline = new Date('2026-03-30T16:00:00Z').toISOString(); // exactly 4h
      expect(getSlaStatus(deadline)).toBe('warning');
    });
  });

  describe('formatTimeRemaining', () => {
    it('formats positive remaining as "Xh Ym Zs"', () => {
      const result = formatTimeRemaining({
        hours: 2,
        minutes: 15,
        seconds: 30,
        totalMs: 8130000,
      });
      expect(result).toBe('2h 15m 30s');
    });

    it('returns "Expirado" for negative totalMs', () => {
      const result = formatTimeRemaining({
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: -3600000,
      });
      expect(result).toBe('Expirado');
    });

    it('omits hours when zero', () => {
      const result = formatTimeRemaining({
        hours: 0,
        minutes: 5,
        seconds: 10,
        totalMs: 310000,
      });
      expect(result).toBe('5m 10s');
    });

    it('shows only seconds when hours and minutes are zero', () => {
      const result = formatTimeRemaining({
        hours: 0,
        minutes: 0,
        seconds: 45,
        totalMs: 45000,
      });
      expect(result).toBe('45s');
    });
  });
});
