import { InjectionToken } from '@angular/core';

import { Observable } from 'rxjs';

export type EquipmentIncidentTransition =
  | 'CHANGED'
  | 'ALREADY_UNAVAILABLE';

export interface EquipmentIncidentOperationPort {
  markAsMaintenance(
    userId: number,
    equipmentId: number,
  ): Observable<EquipmentIncidentTransition>;

  reactivateEquipment(
    userId: number,
    equipmentId: number,
  ): Observable<void>;
}

export const MAINTENANCE_EQUIPMENT_OPERATION_PORT =
  new InjectionToken<EquipmentIncidentOperationPort>(
    'MAINTENANCE_EQUIPMENT_OPERATION_PORT',
  );
