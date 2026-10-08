import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { MaintenanceRentalActivityPort } from './rental-activity.port';

interface ExternalRentalResource {
  equipmentId: number;
  status: 'CONFIRMED' | 'ACTIVE' | 'COMPLETED';
}

interface ExternalRentalsResponse {
  rentals: ExternalRentalResource[];
}

@Injectable()
export class RentalsRentalActivityAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements MaintenanceRentalActivityPort {
  readonly #http = inject(HttpClient);
  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderRentalsEndpointPath}`;

  hasActiveRental(equipmentId: number): Observable<boolean> {
    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      return throwError(() => new Error('Invalid equipment identifier'));
    }

    const params = new HttpParams().set('equipmentId', equipmentId.toString());
    return this.#http.get<ExternalRentalResource[] | ExternalRentalsResponse>(
      this.#endpointUrl,
      { params },
    ).pipe(
      map((response) => {
        const rentals = Array.isArray(response) ? response : response.rentals;
        if (!Array.isArray(rentals)) {
          throw new Error('Invalid rentals response');
        }
        return rentals.some(
          (rental) => rental.equipmentId === equipmentId && rental.status === 'ACTIVE',
        );
      }),
      catchError(this.handleError('Failed to check active rentals')),
    );
  }
}
