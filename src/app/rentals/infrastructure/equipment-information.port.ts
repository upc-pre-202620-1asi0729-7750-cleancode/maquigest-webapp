import { InjectionToken } from '@angular/core';

import { Observable } from 'rxjs';

export interface RentalEquipmentInformation {
  id: number;
  code: string;
  name: string;
}

export interface EquipmentInformationPort {
  getEquipmentInformationByIds(equipmentIds: number[]): Observable<RentalEquipmentInformation[]>;
}

export const EQUIPMENT_INFORMATION_PORT = new InjectionToken<EquipmentInformationPort>(
  'EQUIPMENT_INFORMATION_PORT',
);
