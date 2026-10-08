import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

import { MaintenanceStatus } from '../domain/model/maintenance-status.enum';

export interface MaintenancesResponse extends BaseResponse {
  maintenances: MaintenanceResource[];
}

export interface MaintenanceResource extends BaseResource {
  id: number;

  equipmentId: number;

  performedAt: string;

  type: string;

  status: MaintenanceStatus;
}
