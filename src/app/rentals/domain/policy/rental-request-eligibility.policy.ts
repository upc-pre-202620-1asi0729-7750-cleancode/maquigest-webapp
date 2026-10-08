import { Rental } from '../model/rental.entity';
import { RentalRequest } from '../model/rental-request.entity';
import { RentalStatus } from '../model/rental-status.enum';

/** Business rule owned by Rentals: a committed rental may not be double-booked. */
export class RentalRequestEligibilityPolicy {
  static ensureNoOverlappingCommittedRental(
    request: RentalRequest,
    rentals: readonly Rental[],
  ): void {
    const hasConflict = rentals.some((rental) =>
      rental.equipmentId === request.equipmentId &&
      (rental.status === RentalStatus.CONFIRMED || rental.status === RentalStatus.ACTIVE) &&
      rental.period.overlaps(request.period),
    );

    if (hasConflict) {
      throw new Error('Equipment already has a confirmed or active rental for the selected period');
    }
  }
}
