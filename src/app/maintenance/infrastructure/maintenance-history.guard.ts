import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { IamStore } from '../../iam/application/iam.store';

/** UI navigation guard only. Platform MUST authorize ownership and access. */
export const maintenanceHistoryGuard: CanActivateFn = () => {
  const iam = inject(IamStore);
  const router = inject(Router);

  if (iam.currentUserId() === null) {
    return router.createUrlTree(['/iam/sign-in']);
  }
  return iam.currentRole() === 'rental_company'
    ? true
    : router.createUrlTree(['/dashboard']);
};
