import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';

import { Equipment } from '../domain/model/equipment.entity';
import { DateRange } from '../../shared/domain/value-object/date-range.value-object';

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

  /** Use Inventory's authoritative inclusive-date availability contract. */
  getAvailability(id: number, period: DateRange): Observable<boolean> {
    // Date input values are local calendar days. Avoid toISOString(), which can
    // shift the date when the browser's timezone is not UTC.
    const calendarDay = (date: Date): string =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const params = new HttpParams()
      .set('startDate', calendarDay(period.startDate))
      .set('endDate', calendarDay(period.endDate));

    return this.http.get<{ available: boolean }>(`${this.endpointUrl}/${id}/availability`, { params }).pipe(
      map((response) => {
        if (!response || typeof response.available !== 'boolean') {
          throw new Error('Invalid equipment availability response');
        }
        return response.available;
      }),
      catchError(this.handleError('Failed to check equipment availability')),
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
