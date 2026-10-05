import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { IamStore } from '../../iam/application/iam.store';

import { InventoryStore } from '../application/inventory.store';

export const inventoryManagementGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);

  const inventoryStore = inject(InventoryStore);

  const router = inject(Router);

  const userId = iamStore.currentUserId();

  const role = iamStore.currentRole();

  if (userId === null) {
    router.navigate(['/iam/sign-in']).then();

    return false;
  }

  if (role !== 'rental_company') {
    router.navigate(['/dashboard']).then();

    return false;
  }

  return inventoryStore.canManageInventory(userId).pipe(
    map((canManageInventory) => {
      if (canManageInventory) {
        return true;
      }

      router.navigate(['/subscriptions/plans']).then();

      return false;
    }),

    catchError(() => {
      router.navigate(['/subscriptions/plans']).then();

      return of(false);
    }),
  );
};
