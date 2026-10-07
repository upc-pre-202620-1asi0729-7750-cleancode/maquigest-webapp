import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { catchError, map, of } from 'rxjs';

import { IamStore } from '../../iam/application/iam.store';

import { RentalsStore } from '../application/rentals.store';

export const rentalManagementGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);

  const rentalsStore = inject(RentalsStore);

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

  return rentalsStore.canManageRentals(userId).pipe(
    map((canManageRentals) => {
      if (canManageRentals) {
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
