import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { IamStore } from '../../iam/application/iam.store';

export const constructionRentalRequestGuard: CanActivateFn = () => {
  const iamStore = inject(IamStore);

  const router = inject(Router);

  const userId = iamStore.currentUserId();

  const role = iamStore.currentRole();

  if (userId === null) {
    router.navigate(['/iam/sign-in']).then();

    return false;
  }

  if (role !== 'construction_company') {
    router.navigate(['/dashboard']).then();

    return false;
  }

  return true;
};
