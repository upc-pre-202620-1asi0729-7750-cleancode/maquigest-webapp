import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { MaintenanceIncidentRestrictionPort } from './maintenance-incident-restriction.port';

interface ExternalIncident {
  equipmentId: number;
  status: string;
  blocksRental: boolean;
}

interface ExternalIncidentsResponse {
  incidents: ExternalIncident[];
}

@Injectable()
export class MaintenanceIncidentRestrictionAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements MaintenanceIncidentRestrictionPort {
  readonly #http = inject(HttpClient);
  readonly #endpointUrl =
    `${environment.platformProviderApiBaseUrl}${environment.platformProviderIncidentsEndpointPath}`;

  hasOpenBlockingIncident(equipmentId: number): Observable<boolean> {
    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      return throwError(() => new Error('Invalid equipment identifier'));
    }

    const params = new HttpParams().set('equipmentId', equipmentId.toString());

    return this.#http
      .get<ExternalIncident[] | ExternalIncidentsResponse>(this.#endpointUrl, { params })
      .pipe(
        // Transport errors are not equivalent to "no open incidents".
        catchError(this.handleError('Failed to check maintenance incident restrictions')),
        map((response) => {
          const incidents = Array.isArray(response) ? response : response?.incidents;

          if (!Array.isArray(incidents)) {
            throw new Error('Unable to verify maintenance incidents');
          }

          return incidents.some((incident) =>
            incident.equipmentId === equipmentId &&
            incident.status === 'OPEN' &&
            incident.blocksRental === true,
          );
        }),
      );
  }
}
