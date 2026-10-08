import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface MaintenanceRentalActivityPort {
  hasActiveRental(equipmentId: number): Observable<boolean>;
}

export const MAINTENANCE_RENTAL_ACTIVITY_PORT = new InjectionToken<MaintenanceRentalActivityPort>(
  'MAINTENANCE_RENTAL_ACTIVITY_PORT',
);
