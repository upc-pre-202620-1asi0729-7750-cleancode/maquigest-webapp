import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SignInCommand } from '../domain/model/sign-in.command';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { SignInAssembler } from './sign-in-assembler';
import { SignInPort } from './sign-in.port';
import { SignInResource, SignInResponse } from './sign-in-response';

const signInApiEndpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignInEndpointPath}`;

export class SignInApiEndpoint extends ErrorHandlingEnabledBaseType implements SignInPort {
  readonly #http = inject(HttpClient);
  readonly #assembler = new SignInAssembler();

  signIn(signInCommand: SignInCommand): Observable<SignInResource> {
    const signInRequest = this.#assembler.toRequestFromCommand(signInCommand);

    return this.#http.post<SignInResponse>(signInApiEndpointUrl, signInRequest).pipe(
      map((response) => this.#assembler.toResourceFromResponse(response)),
      catchError(this.handleError('Failed to sign-in')),
    );
  }
}
