import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { Incident } from '../domain/model/incident.entity';

import { IncidentApiEndpoint } from './incident-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class IncidentApi extends BaseApi {
  readonly #incidentEndpoint = new IncidentApiEndpoint(this.http);

  getIncidents(): Observable<Incident[]> {
    return this.#incidentEndpoint.getAll();
  }

  createIncident(incident: Incident): Observable<Incident> {
    return this.#incidentEndpoint.create(incident);
  }

  resolveIncident(incident: Incident): Observable<Incident> {
    return this.#incidentEndpoint.resolveIncident(incident);
  }

  requireRentalRestriction(incident: Incident): Observable<Incident> {
    return this.#incidentEndpoint.requireRentalRestriction(incident);
  }
}
