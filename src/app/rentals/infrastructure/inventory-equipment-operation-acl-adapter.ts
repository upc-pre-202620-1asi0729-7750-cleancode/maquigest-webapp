import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { catchError, map, Observable, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import { EquipmentOperationPort } from './equipment-operation.port';
import { MAINTENANCE_INCIDENT_RESTRICTION_PORT } from './maintenance-incident-restriction.port';

type ExternalEquipmentStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';

interface ExternalAvailabilityBlockResource {
  id: number;

  startDate: string;

  endDate: string;
}

interface ExternalEquipmentResource {
  id: number;

  userId: number;

  code: string;

  name: string;

  description: string;

  categoryId: number;

  location: string;

  dailyRate: number;

  weeklyRate: number;

  status: ExternalEquipmentStatus;

  availabilityBlocks?: ExternalAvailabilityBlockResource[];
}

@Injectable()
export class InventoryEquipmentOperationAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements EquipmentOperationPort
{
  readonly #http = inject(HttpClient);
  readonly #incidentRestriction = inject(MAINTENANCE_INCIDENT_RESTRICTION_PORT);

  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;

  reservePeriod(equipmentId: number, startDate: Date, endDate: Date): Observable<void> {
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      throw new Error('Rental period is invalid');
    }

    return this.#http.get<ExternalEquipmentResource>(`${this.#endpointUrl}/${equipmentId}`).pipe(
      switchMap((equipment) => {
        if (equipment.status !== 'AVAILABLE') {
          throw new Error('Equipment is not available');
        }

        const availabilityBlocks = equipment.availabilityBlocks ?? [];

        const overlaps = availabilityBlocks.some((block) =>
          this.#periodsOverlap(
            startDate,
            endDate,
            new Date(block.startDate),
            new Date(block.endDate),
          ),
        );

        if (overlaps) {
          throw new Error('Equipment is not available for the selected period');
        }

        const nextBlockId =
          availabilityBlocks.reduce((highestId, block) => Math.max(highestId, block.id), 0) + 1;

        // Write only the reservation field; do not overwrite Maintenance status or editable data.
        return this.#http.patch<ExternalEquipmentResource>(
          `${this.#endpointUrl}/${equipmentId}`,
          { availabilityBlocks: [
            ...availabilityBlocks,
            { id: nextBlockId, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          ] },
        );
      }),

      map(() => undefined),

      catchError(this.handleError('Failed to reserve equipment period')),
    );
  }

  markAsRented(equipmentId: number): Observable<void> {
    return this.#updateStatus(equipmentId, 'RENTED');
  }

  markAsAvailable(equipmentId: number): Observable<void> {
    return this.#updateStatus(equipmentId, 'AVAILABLE');
  }

  markAsMaintenance(equipmentId: number): Observable<void> {
    return this.#updateStatus(equipmentId, 'MAINTENANCE');
  }

  #updateStatus(equipmentId: number, status: ExternalEquipmentStatus): Observable<void> {
    return this.#http.get<ExternalEquipmentResource>(`${this.#endpointUrl}/${equipmentId}`).pipe(
      switchMap((equipment) => {
        if (status === 'RENTED' && equipment.status !== 'AVAILABLE') {
          throw new Error('Cannot rent equipment that is not available');
        }
        if (status === 'AVAILABLE' && equipment.status === 'MAINTENANCE') {
          throw new Error('Maintenance equipment must be reactivated through Maintenance');
        }
        if (status === 'AVAILABLE') {
          // A return must not erase a restriction reported while the equipment was rented.
          return this.#incidentRestriction.hasOpenBlockingIncident(equipmentId).pipe(
            switchMap((blocked) => this.#http.patch<ExternalEquipmentResource>(
              `${this.#endpointUrl}/${equipmentId}`,
              { status: blocked ? 'MAINTENANCE' : 'AVAILABLE' },
            )),
          );
        }
        // A status-only PATCH cannot erase a separate reservation update.
        return this.#http.patch<ExternalEquipmentResource>(
          `${this.#endpointUrl}/${equipmentId}`,
          { status },
        );
      }),
      map(() => undefined),
      catchError(this.handleError('Failed to update equipment status')),
    );
  }

  #periodsOverlap(firstStart: Date, firstEnd: Date, secondStart: Date, secondEnd: Date): boolean {
    return firstStart <= secondEnd && secondStart <= firstEnd;
  }
}
