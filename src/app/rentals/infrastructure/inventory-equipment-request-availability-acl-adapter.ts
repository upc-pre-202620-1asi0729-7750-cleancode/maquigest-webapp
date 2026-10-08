import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { EquipmentRequestAvailabilityPort } from './equipment-request-availability.port';

interface ExternalAvailabilityBlock {
  startDate: string;
  endDate: string;
}

interface ExternalEquipment {
  id: number;
  userId: number;
  status: string;
  availabilityBlocks?: ExternalAvailabilityBlock[];
}

@Injectable()
export class InventoryEquipmentRequestAvailabilityAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements EquipmentRequestAvailabilityPort {
  readonly #http = inject(HttpClient);
  readonly #endpointUrl =
    `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;

  assertAvailableForRequest(
    equipmentId: number,
    rentalCompanyUserId: number,
    startDate: Date,
    endDate: Date,
  ): Observable<void> {
    if (
      !Number.isInteger(equipmentId) || equipmentId <= 0 ||
      !Number.isInteger(rentalCompanyUserId) || rentalCompanyUserId <= 0 ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      return throwError(() => new Error('Invalid equipment, company or rental period'));
    }

    return this.#http.get<ExternalEquipment>(`${this.#endpointUrl}/${equipmentId}`).pipe(
      // Handle HTTP failures before mapping, so business-rule errors remain readable.
      catchError(this.handleError('Failed to check current equipment availability')),
      map((equipment) => {
        if (!equipment || equipment.id !== equipmentId) {
          throw new Error('Equipment not found');
        }

        if (equipment.userId !== rentalCompanyUserId) {
          throw new Error('Equipment does not belong to the requested rental company');
        }

        if (equipment.status !== 'AVAILABLE') {
          throw new Error('Equipment is not available: its operational status has changed');
        }

        if (
          equipment.availabilityBlocks !== undefined &&
          !Array.isArray(equipment.availabilityBlocks)
        ) {
          throw new Error('Unable to verify equipment reservations');
        }

        const reserved = (equipment.availabilityBlocks ?? []).some((block) => {
          const blockedStart = new Date(block.startDate);
          const blockedEnd = new Date(block.endDate);

          // Invalid stored reservations must fail closed.
          if (
            Number.isNaN(blockedStart.getTime()) ||
            Number.isNaN(blockedEnd.getTime()) ||
            blockedStart > blockedEnd
          ) {
            throw new Error('Unable to verify equipment reservations');
          }

          return startDate <= blockedEnd && blockedStart <= endDate;
        });

        if (reserved) {
          throw new Error('Equipment is already reserved for the selected period');
        }

        return undefined;
      }),
    );
  }
}
