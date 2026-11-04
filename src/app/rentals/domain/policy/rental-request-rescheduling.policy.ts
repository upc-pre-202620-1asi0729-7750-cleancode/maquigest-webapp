import { DateRange } from '../../../shared/domain/value-object/date-range.value-object';
import { RentalLifecycleDatePolicy } from './rental-lifecycle-date.policy';

export type RentalReschedulingDateIssue = 'INVALID' | 'REVERSED' | 'PAST' | null;

/** Date-only validation and ISO boundary conversion for the Rentals context. */
export class RentalRequestReschedulingPolicy {
  static issue(startDay: string, endDay: string, now = new Date()): RentalReschedulingDateIssue {
    if (!RentalLifecycleDatePolicy.validDay(startDay) ||
        !RentalLifecycleDatePolicy.validDay(endDay)) return 'INVALID';
    if (endDay < startDay) return 'REVERSED';
    if (startDay < RentalLifecycleDatePolicy.limaDay(now)) return 'PAST';
    return null;
  }

  /** Lima is UTC-05:00. Request periods include the entire final calendar day. */
  static toPeriod(startDay: string, endDay: string): DateRange {
    if (!RentalLifecycleDatePolicy.validDay(startDay) ||
        !RentalLifecycleDatePolicy.validDay(endDay) || endDay < startDay) {
      throw new Error('Invalid rental calendar period');
    }
    return new DateRange({
      startDate: new Date(`${startDay}T00:00:00.000-05:00`),
      endDate: new Date(`${endDay}T23:59:59.999-05:00`),
    });
  }
}
