import { HttpClient } from '@angular/common/http';

import { map, Observable, of, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { Incident } from '../domain/model/incident.entity';
import { IncidentStatus } from '../domain/model/incident-status.enum';

import { IncidentAssembler } from './incident-assembler';
import { IncidentResource, IncidentsResponse } from './incident-response';

export class IncidentApiEndpoint extends BaseApiEndpoint<
  Incident,
  IncidentResource,
  IncidentsResponse,
  IncidentAssembler
> {
  readonly #httpClient: HttpClient;
  readonly #endpointUrl =
    `${environment.platformProviderApiBaseUrl}${environment.platformProviderIncidentsEndpointPath}`;
  readonly #incidentAssembler = new IncidentAssembler();

  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderIncidentsEndpointPath}`,
      new IncidentAssembler(),
    );
    this.#httpClient = http;
  }

  resolveIncident(incident: Incident): Observable<Incident> {
    if (
      !Number.isInteger(incident.id) ||
      incident.id <= 0 ||
      incident.status !== IncidentStatus.RESOLVED ||
      incident.resolvedAt === null
    ) {
      throw new Error('Incident must be resolved before persisting');
    }

    return this.#httpClient
      .patch<IncidentResource>(`${this.#endpointUrl}/${incident.id}`, {
        status: incident.status,
        resolvedAt: incident.resolvedAt.toISOString(),
      })
      .pipe(
        map((resource) =>
          this.#incidentAssembler.toEntityFromResource(resource),
        ),
      );
  }

  requireRentalRestriction(incident: Incident): Observable<Incident> {
    if (
      !Number.isInteger(incident.id) ||
      incident.id <= 0 ||
      incident.status !== IncidentStatus.OPEN ||
      !incident.blocksRental
    ) {
      throw new Error('Only an open blocking incident can be persisted');
    }

    const url = `${this.#endpointUrl}/${incident.id}`;

    return this.#httpClient.get<IncidentResource>(url).pipe(
      switchMap((current) => {
        if (
          current.equipmentId !== incident.equipmentId ||
          (current.status ?? IncidentStatus.OPEN) !== IncidentStatus.OPEN
        ) {
          throw new Error('The incident was modified or already resolved');
        }

        if (current.blocksRental === true) {
          return of(current);
        }

        return this.#httpClient.patch<IncidentResource>(url, {
          blocksRental: true,
        });
      }),
      map((resource) => this.#incidentAssembler.toEntityFromResource(resource)),
    );
  }
}
