import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { Maintenance } from '../domain/model/maintenance.entity';
import { MaintenanceStatus } from '../domain/model/maintenance-status.enum';
import { MaintenancePatchResource } from './maintenance-patch-resource';

import { MaintenanceAssembler } from './maintenance-assembler';

import { MaintenanceResource, MaintenancesResponse } from './maintenance-response';

export class MaintenanceApiEndpoint extends BaseApiEndpoint<
  Maintenance,
  MaintenanceResource,
  MaintenancesResponse,
  MaintenanceAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,

      `${environment.platformProviderApiBaseUrl}${environment.platformProviderMaintenancesEndpointPath}`,

      new MaintenanceAssembler(),
    );
  }

  /** Adapts the existing maintenance lifecycle REST command; does not create a record. */
  advanceMaintenance(
    maintenanceId: number,
    status: MaintenanceStatus,
    technician: string,
    notes: string,
  ): Observable<Maintenance> {
    const resource: MaintenancePatchResource = {
      status,
      technician,
      acknowledge: false,
      notes,
    };

    return this.http
      .patch<MaintenanceResource>(`${this.endpointUrl}/${maintenanceId}`, resource)
      .pipe(
        map((response) => this.assembler.toEntityFromResource(response)),
        catchError(this.handleError('Failed to advance maintenance')),
      );
  }

}
