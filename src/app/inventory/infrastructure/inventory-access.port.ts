import { InjectionToken } from '@angular/core';

import { Observable } from 'rxjs';

export interface InventoryAccessPort {
  canManageInventory(userId: number): Observable<boolean>;

  getActiveProviderUserIds(): Observable<number[]>;
}

export const INVENTORY_ACCESS_PORT = new InjectionToken<InventoryAccessPort>(
  'INVENTORY_ACCESS_PORT',
);
