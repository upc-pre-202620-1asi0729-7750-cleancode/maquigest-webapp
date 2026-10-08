import { InjectionToken, Signal } from '@angular/core';
import { DateRange } from '../../shared/domain/value-object/date-range.value-object';

/** Inventory-owned port. Rentals entities and stores never enter Inventory Presentation. */
export interface EquipmentRentalRequestSummary {
  status: string;
}

export interface EquipmentRentalRequestPort {
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly subscriptionRequired: Signal<boolean>;
  readonly latestCreatedRequest: Signal<EquipmentRentalRequestSummary | null>;
  submitRentalRequest(
    equipmentId: number,
    constructionUserId: number,
    rentalCompanyUserId: number,
    period: DateRange,
  ): void;
  clearCreationState(): void;
}

export const EQUIPMENT_RENTAL_REQUEST_PORT = new InjectionToken<EquipmentRentalRequestPort>(
  'EQUIPMENT_RENTAL_REQUEST_PORT',
);
