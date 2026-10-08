import { computed, inject, Injectable } from '@angular/core';
import { DateRange } from '../../shared/domain/value-object/date-range.value-object';
import { RentalsStore } from '../../rentals/application/rentals.store';
import { RentalRequest } from '../../rentals/domain/model/rental-request.entity';
import { EquipmentRentalRequestPort } from './equipment-rental-request.port';

/** Anti-corruption adapter: converts Inventory's command into a Rentals aggregate command. */
@Injectable()
export class RentalsEquipmentRentalRequestAclAdapter implements EquipmentRentalRequestPort {
  readonly #rentals = inject(RentalsStore);
  readonly loading = this.#rentals.loading;
  readonly error = this.#rentals.error;
  readonly subscriptionRequired = this.#rentals.subscriptionRequired;
  readonly latestCreatedRequest = computed(() => {
    const created = this.#rentals.latestCreatedRequest();
    return created ? { status: created.status } : null;
  });

  submitRentalRequest(
    equipmentId: number,
    constructionUserId: number,
    rentalCompanyUserId: number,
    period: DateRange,
  ): void {
    this.#rentals.createRentalRequest(new RentalRequest({
      id: 0,
      equipmentId,
      constructionUserId,
      rentalCompanyUserId,
      period,
    }));
  }

  clearCreationState(): void {
    this.#rentals.clearCreationState();
  }
}
