import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { IamStore } from '../../iam/application/iam.store';

import { MAINTENANCE_ACCESS_PORT } from './maintenance-access.port';

export const maintenanceManagementGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);

  const subscriptionAccess = inject(MAINTENANCE_ACCESS_PORT);

  const router = inject(Router);

  const userId = iamStore.currentUserId();
  const role = iamStore.currentRole();

  if (userId === null) {
    return router.createUrlTree(['/iam/sign-in']);
  }

  if (role !== 'rental_company') {
    return router.createUrlTree(['/dashboard']);
  }

  return subscriptionAccess.canRegisterMaintenance(userId).pipe(
    map((canRegisterMaintenance) =>
      canRegisterMaintenance ? true : router.createUrlTree(['/subscriptions/plans']),
    ),

    catchError(() => of(router.createUrlTree(['/subscriptions/plans']))),
  );
};
