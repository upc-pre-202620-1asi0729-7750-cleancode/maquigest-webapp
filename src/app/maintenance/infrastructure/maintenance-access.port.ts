import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface MaintenanceAccessPort {
  canRegisterMaintenance(userId: number): Observable<boolean>;
}

export const MAINTENANCE_ACCESS_PORT = new InjectionToken<MaintenanceAccessPort>(
  'MAINTENANCE_ACCESS_PORT',
);
