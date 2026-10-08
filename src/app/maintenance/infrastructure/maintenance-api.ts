import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { Maintenance } from '../domain/model/maintenance.entity';

import { MaintenanceApiEndpoint } from './maintenance-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceApi extends BaseApi {
  readonly #maintenanceEndpoint = new MaintenanceApiEndpoint(this.http);

  getMaintenances(): Observable<Maintenance[]> {
    return this.#maintenanceEndpoint.getAll();
  }

  createMaintenance(maintenance: Maintenance): Observable<Maintenance> {
    return this.#maintenanceEndpoint.create(maintenance);
  }
}
