import {
  BaseResource,
  BaseResponse,
} from '../../shared/infrastructure/base-response';

import { IncidentStatus } from '../domain/model/incident-status.enum';

export interface IncidentsResponse extends BaseResponse {
  incidents: IncidentResource[];
}

export interface IncidentResource extends BaseResource {
  id: number;
  equipmentId: number;
  description: string;
  reportedAt: string;
  blocksRental?: boolean;
  status?: IncidentStatus;
  resolvedAt?: string | null;
}
