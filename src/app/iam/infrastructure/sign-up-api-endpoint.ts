import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import { SignUpCommand } from '../domain/model/sign-up.command';
import { SignUpAssembler } from './sign-up-assembler';
import { SignUpResource, SignUpResponse } from './sign-up-response';

const signUpApiEndpointUrl =
  `${environment.platformProviderApiBaseUrl}` + `${environment.platformProviderSignUpEndpointPath}`;

@Injectable({
  providedIn: 'root',
})
export class SignUpApiEndpoint extends ErrorHandlingEnabledBaseType {
  readonly #http = inject(HttpClient);
  readonly #assembler = new SignUpAssembler();

  signUp(signUpCommand: SignUpCommand): Observable<SignUpResource> {
    const signUpRequest = this.#assembler.toRequestFromCommand(signUpCommand);

    return this.#http.post<SignUpResponse>(signUpApiEndpointUrl, signUpRequest).pipe(
      map((response) => this.#assembler.toResourceFromResponse(response)),
      catchError(this.handleError('Failed to sign-up')),
    );
  }
}
