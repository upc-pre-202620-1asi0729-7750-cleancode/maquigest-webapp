import { InjectionToken } from '@angular/core';

import { Observable } from 'rxjs';

export type MaintenanceEquipmentOperationalStatus =
  | 'AVAILABLE'
  | 'RENTED'
  | 'MAINTENANCE';

export interface MaintenanceEquipmentInformation {
  id: number;
  ownerUserId: number;
  code: string;
  name: string;
  status?: MaintenanceEquipmentOperationalStatus;
}

export interface EquipmentInformationPort {
  getEquipmentInformationByUserId(userId: number): Observable<MaintenanceEquipmentInformation[]>;
}

export const MAINTENANCE_EQUIPMENT_INFORMATION_PORT = new InjectionToken<EquipmentInformationPort>(
  'MAINTENANCE_EQUIPMENT_INFORMATION_PORT',
);
