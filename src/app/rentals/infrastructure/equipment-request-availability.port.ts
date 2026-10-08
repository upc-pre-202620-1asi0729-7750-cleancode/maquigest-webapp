import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

/** Rentals-owned port; no Inventory domain models cross this boundary. */
export interface EquipmentRequestAvailabilityPort {
  assertAvailableForRequest(
    equipmentId: number,
    rentalCompanyUserId: number,
    startDate: Date,
    endDate: Date,
  ): Observable<void>;
}

export const EQUIPMENT_REQUEST_AVAILABILITY_PORT =
  new InjectionToken<EquipmentRequestAvailabilityPort>(
    'EQUIPMENT_REQUEST_AVAILABILITY_PORT',
  );
