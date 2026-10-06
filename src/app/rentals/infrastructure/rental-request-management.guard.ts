import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { IamStore } from '../../iam/application/iam.store';

import { SUBSCRIPTION_ACCESS_PORT } from './subscription-access.port';

export const rentalRequestManagementGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);

  const subscriptionAccess = inject(SUBSCRIPTION_ACCESS_PORT);

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

  return subscriptionAccess.hasActiveSubscription(userId).pipe(
    map((hasActiveSubscription) => {
      if (hasActiveSubscription) {
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
