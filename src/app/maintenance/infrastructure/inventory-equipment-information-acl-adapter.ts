import { inject, Injectable } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';

import { catchError, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import {
  EquipmentInformationPort,
  MaintenanceEquipmentInformation,
  MaintenanceEquipmentOperationalStatus,
} from './equipment-information.port';

interface ExternalEquipmentResource {
  id: number;
  userId: number;
  code: string;
  name: string;
  status?: MaintenanceEquipmentOperationalStatus;
}

interface ExternalEquipmentsResponse {
  equipments: ExternalEquipmentResource[];
}

@Injectable()
export class InventoryEquipmentInformationAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements EquipmentInformationPort
{
  readonly #http = inject(HttpClient);

  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`;

  getEquipmentInformationByUserId(userId: number): Observable<MaintenanceEquipmentInformation[]> {
    const params = new HttpParams().set('userId', userId.toString());

    return this.#http
      .get<ExternalEquipmentResource[] | ExternalEquipmentsResponse>(this.#endpointUrl, { params })
      .pipe(
        map((response) => {
          const resources = Array.isArray(response) ? response : response.equipments;

          return resources.map((resource) => ({
            id: resource.id,
            ownerUserId: resource.userId,
            code: resource.code,
            name: resource.name,
            status: resource.status,
          }));
        }),
        catchError(this.handleError('Failed to fetch equipment information for maintenance')),
      );
  }
}
