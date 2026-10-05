import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { IamStore } from '../application/iam.store';

export const iamGuard: CanActivateFn = () => {
  const store = inject(IamStore);
  const router = inject(Router);

  if (store.isSignedIn()) {
    return true;
  }

  router.navigate(['/iam/sign-in']).then();
  return false;
};
