import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';

import { Equipment } from '../domain/model/equipment.entity';

import { EquipmentResource, EquipmentsResponse } from './equipment-response';

import { EquipmentAssembler } from './equipment-assembler';

export class EquipmentApiEndpoint extends BaseApiEndpoint<
  Equipment,
  EquipmentResource,
  EquipmentsResponse,
  EquipmentAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}`,
      new EquipmentAssembler(),
    );
  }

  getByUserId(userId: number): Observable<Equipment[]> {
    const params = new HttpParams().set('userId', userId.toString());

    return this.http
      .get<EquipmentsResponse | EquipmentResource[]>(this.endpointUrl, { params })
      .pipe(
        map((response) => {
          const resources = Array.isArray(response) ? response : response.equipments;

          return resources.map((resource) => this.assembler.toEntityFromResource(resource));
        }),
        catchError(this.handleError('Failed to fetch equipment by user id')),
      );
  }
}
