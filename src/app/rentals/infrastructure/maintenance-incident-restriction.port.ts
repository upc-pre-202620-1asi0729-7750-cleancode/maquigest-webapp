import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

/** Rentals-owned port for querying blocking maintenance restrictions. */
export interface MaintenanceIncidentRestrictionPort {
  hasOpenBlockingIncident(equipmentId: number): Observable<boolean>;
}

export const MAINTENANCE_INCIDENT_RESTRICTION_PORT =
  new InjectionToken<MaintenanceIncidentRestrictionPort>(
    'MAINTENANCE_INCIDENT_RESTRICTION_PORT',
  );
