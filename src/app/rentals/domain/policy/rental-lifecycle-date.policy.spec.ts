import { describe, expect, it } from 'vitest';

import type { Rental } from '../model/rental.entity';
import { RentalLifecycleDatePolicy as Policy } from './rental-lifecycle-date.policy';

const rental = {
  isConfirmed: true,
  period: {
    startDate: new Date('2026-12-20T05:00:00Z'),
    endDate: new Date('2026-12-23T04:59:59.999Z'),
  },
} as Rental;

const earlyNow = new Date('2026-11-04T14:30:00Z');

// These expectations must hold regardless of the browser's configured timezone.
describe('RentalLifecycleDatePolicy', () => {
  it('uses Lima calendar dates rather than UTC dates', () => {
    expect(Policy.limaDay(rental.period.endDate)).toBe('2026-12-22');
    expect(Policy.limaDay(rental.period.startDate)).toBe('2026-12-20');
  });

  it('blocks a delivery before the contracted period', () => {
    expect(Policy.deliveryDayIssue('2026-11-04', rental, earlyNow)).toBe('before-start');
    expect(Policy.canDeliverNow(rental, earlyNow)).toBe(false);
  });

  it('blocks future deliveries and allows one during the period', () => {
    const withinPeriod = new Date('2026-12-20T16:00:00Z');
    expect(Policy.deliveryDayIssue('2026-12-21', rental, withinPeriod)).toBe('future');
    expect(Policy.deliveryDayIssue('2026-12-20', rental, withinPeriod)).toBe(null);
    expect(Policy.canDeliverNow(rental, withinPeriod)).toBe(true);
  });

  it('blocks delivery after end and rejects impossible calendar dates', () => {
    const later = new Date('2027-01-10T15:00:00Z');
    expect(Policy.deliveryDayIssue('2026-12-23', rental, later)).toBe('after-end');
    expect(Policy.validDay('2026-02-30')).toBe(false);
  });

  it('supports overdue returns but rejects future returns', () => {
    const later = new Date('2027-01-10T15:00:00Z');
    expect(Policy.returnDayIssue('2027-01-09', rental, later)).toBe(null);
    expect(Policy.returnDayIssue('2027-01-11', rental, later)).toBe('future');
  });

  it('uses the real current instant for actions recorded today', () => {
    expect(Policy.selectedDayToInstant('2026-11-04', earlyNow).toISOString())
      .toBe('2026-11-04T14:30:00.000Z');
  });
});
