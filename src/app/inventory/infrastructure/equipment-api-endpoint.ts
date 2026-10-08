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

  /** PATCH only editable fields; Inventory operational state and reservations are never sent. */
  patchEditableFields(equipment: Equipment): Observable<Equipment> {
    if (!Number.isInteger(equipment.id) || equipment.id <= 0) {
      throw new Error('Invalid equipment identifier');
    }
    const editable = {
      code: equipment.code,
      name: equipment.name,
      description: equipment.description,
      categoryId: equipment.categoryId,
      location: equipment.location,
      dailyRate: equipment.rentalRate.dailyRate,
      weeklyRate: equipment.rentalRate.weeklyRate,
    };
    return this.http.patch<EquipmentResource>(`${this.endpointUrl}/${equipment.id}`, editable).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to update editable equipment fields')),
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
