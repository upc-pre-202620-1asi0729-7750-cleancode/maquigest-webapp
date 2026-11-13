import type { Rental } from '../model/rental.entity';

export type RentalDateIssue =
  | 'invalid'
  | 'before-start'
  | 'after-end'
  | 'future';

/** Business calendar days are evaluated in Lima regardless of browser timezone. */
export class RentalLifecycleDatePolicy {
  private static readonly zone = 'America/Lima';

  static limaDay(date: Date): string {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: this.zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  static validDay(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T12:00:00-05:00`);
    return !Number.isNaN(parsed.getTime()) && this.limaDay(parsed) === value;
  }

  static deliveryDayIssue(value: string, rental: Rental, now = new Date()): RentalDateIssue | null {
    if (!this.validDay(value)) return 'invalid';
    if (value < this.limaDay(rental.period.startDate)) return 'before-start';
    if (value > this.limaDay(rental.period.endDate)) return 'after-end';
    if (value > this.limaDay(now)) return 'future';
    return null;
  }

  static returnDayIssue(value: string, rental: Rental, now = new Date()): RentalDateIssue | null {
    if (!this.validDay(value)) return 'invalid';
    if (value < this.limaDay(rental.period.startDate)) return 'before-start';
    // Late returns are possible: do not require the return to precede the contracted end.
    if (value > this.limaDay(now)) return 'future';
    return null;
  }

  static deliveryInstantIssue(value: Date, rental: Rental, now = new Date()): RentalDateIssue | null {
    if (Number.isNaN(value.getTime())) return 'invalid';
    if (value < rental.period.startDate) return 'before-start';
    if (value > rental.period.endDate) return 'after-end';
    if (value > now) return 'future';
    return null;
  }

  static returnInstantIssue(value: Date, rental: Rental, now = new Date()): RentalDateIssue | null {
    if (Number.isNaN(value.getTime())) return 'invalid';
    if (value < rental.period.startDate) return 'before-start';
    if (value > now) return 'future';
    return null;
  }

  static canDeliverNow(rental: Rental, now = new Date()): boolean {
    return rental.isConfirmed && this.deliveryInstantIssue(now, rental, now) === null;
  }

  /** Today's action uses its real timestamp (never a future noon timestamp). */
  static selectedDayToInstant(value: string, now = new Date()): Date {
    if (!this.validDay(value)) return new Date(NaN);
    if (value === this.limaDay(now)) return new Date(now.getTime());
    return new Date(`${value}T12:00:00-05:00`);
  }

  static describe(issue: RentalDateIssue, language: string, startDay: string, endDay?: string): string {
    const spanish = language.toLowerCase().startsWith('es');
    switch (issue) {
      case 'invalid':
        return spanish ? 'Selecciona una fecha valida.' : 'Select a valid date.';
      case 'before-start':
        return spanish
          ? `La operacion no puede registrarse antes del ${startDay}.`
          : `This operation cannot be registered before ${startDay}.`;
      case 'after-end':
        return spanish
          ? `La entrega debe realizarse a mas tardar el ${endDay ?? startDay}.`
          : `Delivery must occur by ${endDay ?? startDay}.`;
      case 'future':
        return spanish
          ? 'No se pueden registrar operaciones con fecha futura.'
          : 'Operations cannot be recorded with a future date.';
    }
  }
}
