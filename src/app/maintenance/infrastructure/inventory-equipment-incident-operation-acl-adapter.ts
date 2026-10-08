import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import {
  catchError,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';

import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import {
  EquipmentIncidentOperationPort,
  EquipmentIncidentTransition,
} from './equipment-incident-operation.port';

type ExternalEquipmentStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';

interface ExternalEquipmentResource {
  id: number;
  userId: number;
  status: ExternalEquipmentStatus;
}

@Injectable()
export class InventoryEquipmentIncidentOperationAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements EquipmentIncidentOperationPort {

  readonly #http = inject(HttpClient);

  readonly #endpointUrl =
    `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;

  markAsMaintenance(
    userId: number,
    equipmentId: number,
  ): Observable<EquipmentIncidentTransition> {
    if (
      !Number.isInteger(userId) || userId <= 0 ||
      !Number.isInteger(equipmentId) || equipmentId <= 0
    ) {
      return throwError(() => new Error('Invalid company or equipment identifier'));
    }

    const url = `${this.#endpointUrl}/${equipmentId}`;

    return this.#http.get<ExternalEquipmentResource>(url).pipe(
      switchMap((equipment) => {
        if (!equipment || equipment.id !== equipmentId || equipment.userId !== userId) {
          return throwError(() => new Error('Equipment does not belong to this company'));
        }

        if (equipment.status === 'RENTED') {
          return throwError(() => new Error('Rented equipment cannot be automatically marked as maintenance'));
        }

        if (equipment.status === 'MAINTENANCE') {
          return of('ALREADY_UNAVAILABLE' as EquipmentIncidentTransition);
        }

        if (equipment.status !== 'AVAILABLE') {
          return throwError(() => new Error('Equipment status does not allow this operation'));
        }

        return this.#http.patch<ExternalEquipmentResource>(url, {
          status: 'MAINTENANCE',
        }).pipe(map(() => 'CHANGED' as EquipmentIncidentTransition));
      }),
      catchError(this.handleError('Failed to mark equipment as maintenance')),
    );
  }

  reactivateEquipment(userId: number, equipmentId: number): Observable<void> {
    if (
      !Number.isInteger(userId) || userId <= 0 ||
      !Number.isInteger(equipmentId) || equipmentId <= 0
    ) {
      return throwError(() => new Error('Invalid company or equipment identifier'));
    }

    const url = `${this.#endpointUrl}/${equipmentId}`;

    // Read the current Inventory state. Never overwrite an active RENTED state.
    return this.#http.get<ExternalEquipmentResource>(url).pipe(
      switchMap((equipment) => {
        if (!equipment || equipment.id !== equipmentId || equipment.userId !== userId) {
          return throwError(() => new Error('Equipment does not belong to this company'));
        }

        if (equipment.status !== 'MAINTENANCE') {
          return throwError(() => new Error('Only equipment in MAINTENANCE can be reactivated'));
        }

        // PATCH only the operational state, preserving rental periods and other Inventory fields.
        return this.#http.patch<ExternalEquipmentResource>(url, {
          status: 'AVAILABLE',
        }).pipe(map(() => undefined));
      }),
      catchError(this.handleError('Failed to reactivate equipment')),
    );
  }
}
