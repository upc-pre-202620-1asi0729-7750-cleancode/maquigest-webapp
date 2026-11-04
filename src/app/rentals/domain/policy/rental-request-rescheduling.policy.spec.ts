import { describe, expect, it } from 'vitest';
import { RentalRequestReschedulingPolicy as Policy } from './rental-request-rescheduling.policy';

const now = new Date('2026-11-04T16:00:00Z');

describe('RentalRequestReschedulingPolicy', () => {
  it('permits present and future days in the Lima timezone', () => {
    expect(Policy.issue('2026-11-04', '2026-11-04', now)).toBe(null);
    expect(Policy.issue('2026-11-10', '2026-11-12', now)).toBe(null);
  });
  it('rejects past dates using Lima rather than UTC', () => {
    const utcNov5ButLimaNov4 = new Date('2026-11-05T02:00:00Z');
    expect(Policy.issue('2026-11-04', '2026-11-05', utcNov5ButLimaNov4)).toBe(null);
    expect(Policy.issue('2026-11-03', '2026-11-05', now)).toBe('PAST');
  });
  it('rejects reversed and nonexistent calendar days', () => {
    expect(Policy.issue('2026-11-12', '2026-11-10', now)).toBe('REVERSED');
    expect(Policy.issue('2026-02-30', '2026-03-02', now)).toBe('INVALID');
  });
  it('converts inclusive Lima days to UTC Instants for the Spring Boot API', () => {
    const period = Policy.toPeriod('2026-11-10', '2026-11-12');
    expect(period.startDate.toISOString()).toBe('2026-11-10T05:00:00.000Z');
    expect(period.endDate.toISOString()).toBe('2026-11-13T04:59:59.999Z');
  });
  it('does not create a period from invalid dates', () => {
    expect(() => Policy.toPeriod('2026-11-15', '2026-11-12')).toThrow();
  });
});
