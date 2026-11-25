import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { IamStore } from '../application/iam.store';

/** Never disclose the session token to third-party hosts or static asset requests. */
export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = environment.platformProviderApiBaseUrl.replace(/\/+$/, '');
  const isPlatformRequest = request.url.startsWith(`${baseUrl}/`);
  const isAuthenticationRequest = request.url.startsWith(`${baseUrl}/authentication/`);

  if (!isPlatformRequest || isAuthenticationRequest) return next(request);

  const store = inject(IamStore);
  const router = inject(Router);
  const token = store.currentToken();
  return next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request).pipe(
    tap({ error: (error: unknown) => {
      // A response for an older token must not invalidate a newer session.
      if (error instanceof HttpErrorResponse && error.status === 401 && token &&
          store.currentToken() === token && localStorage.getItem('token') === token) {
        store.signOut(router);
      }
    } }),
  );
};
