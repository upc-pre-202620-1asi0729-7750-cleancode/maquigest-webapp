import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { Maintenance } from '../domain/model/maintenance.entity';

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
}
