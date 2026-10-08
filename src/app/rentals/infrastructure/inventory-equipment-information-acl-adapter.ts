import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { catchError, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import { EquipmentInformationPort, RentalEquipmentInformation } from './equipment-information.port';

interface ExternalEquipmentResource {
  id: number;
  code: string;
  name: string;
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

  getEquipmentInformationByIds(equipmentIds: number[]): Observable<RentalEquipmentInformation[]> {
    const requestedIds = new Set(equipmentIds);

    return this.#http
      .get<ExternalEquipmentResource[] | ExternalEquipmentsResponse>(this.#endpointUrl)
      .pipe(
        map((response) => {
          const resources = Array.isArray(response) ? response : response.equipments;

          return resources
            .filter((resource) => requestedIds.has(resource.id))
            .map((resource) => ({
              id: resource.id,
              code: resource.code,
              name: resource.name,
            }));
        }),

        catchError(this.handleError('Failed to fetch equipment information')),
      );
  }
}
