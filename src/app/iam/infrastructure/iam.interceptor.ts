import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { IamStore } from '../application/iam.store';

/** Never disclose the session token to third-party hosts or static asset requests. */
export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = environment.platformProviderApiBaseUrl.replace(/\/+$/, '');
  const isPlatformRequest = request.url.startsWith(`${baseUrl}/`);
  const isAuthenticationRequest = request.url.startsWith(`${baseUrl}/authentication/`);

  if (!isPlatformRequest || isAuthenticationRequest) return next(request);

  const token = inject(IamStore).currentToken();
  return next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request);
};
