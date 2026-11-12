import { MaintenanceStatus } from '../domain/model/maintenance-status.enum';

/** Existing PATCH /api/v1/maintenances/{id} contract from Spring Boot. */
export interface MaintenancePatchResource {
  status: MaintenanceStatus | null;
  technician: string | null;
  acknowledge: boolean;
  notes: string | null;
}
