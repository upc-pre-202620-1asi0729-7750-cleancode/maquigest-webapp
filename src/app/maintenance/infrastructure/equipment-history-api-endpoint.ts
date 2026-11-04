import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EquipmentHistory } from '../domain/model/equipment-history';
import { EquipmentHistoryAssembler } from './equipment-history-assembler';
import { EquipmentHistoryResource } from './equipment-history-response';

@Injectable({ providedIn: 'root' })
export class EquipmentHistoryApiEndpoint {
  readonly #http = inject(HttpClient);
  readonly #assembler = new EquipmentHistoryAssembler();
  readonly #maintenancesUrl =
    `${environment.platformProviderApiBaseUrl}${environment.platformProviderMaintenancesEndpointPath}`;

  getByEquipmentId(equipmentId: number): Observable<EquipmentHistory> {
    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      throw new Error('Invalid equipment identifier');
    }

    return this.#http
      .get<EquipmentHistoryResource>(`${this.#maintenancesUrl}/equipment/${equipmentId}/history`)
      .pipe(map((resource) => {
        if (resource.equipmentId !== equipmentId) {
          throw new Error('Equipment history response does not match the requested equipment');
        }
        return this.#assembler.toEntity(resource);
      }));
  }
}
