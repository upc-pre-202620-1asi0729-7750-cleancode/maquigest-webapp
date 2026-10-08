import { InjectionToken } from '@angular/core';

import { Observable } from 'rxjs';

export interface EquipmentOperationPort {
  reservePeriod(equipmentId: number, startDate: Date, endDate: Date): Observable<void>;

  markAsRented(equipmentId: number): Observable<void>;

  markAsAvailable(equipmentId: number): Observable<void>;

  markAsMaintenance(equipmentId: number): Observable<void>;
}

export const EQUIPMENT_OPERATION_PORT = new InjectionToken<EquipmentOperationPort>(
  'EQUIPMENT_OPERATION_PORT',
);
