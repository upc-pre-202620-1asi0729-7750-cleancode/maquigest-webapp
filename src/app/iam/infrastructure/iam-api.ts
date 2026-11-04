import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SignInCommand } from '../domain/model/sign-in.command';
import { PasswordRecoveryCommand } from '../domain/model/password-recovery.command';
import { SignUpCommand } from '../domain/model/sign-up.command';

import { SIGN_IN_PORT } from './sign-in.port';
import { SignInResource } from './sign-in-response';

import { SignUpApiEndpoint } from './sign-up-api-endpoint';
import { PasswordRecoveryApiEndpoint } from './password-recovery-api-endpoint';
import { SignUpResource } from './sign-up-response';

@Injectable({
  providedIn: 'root',
})
export class IamApi {
  readonly #signInEndpoint = inject(SIGN_IN_PORT);
  readonly #signUpEndpoint = inject(SignUpApiEndpoint);
  readonly #passwordRecoveryEndpoint = inject(PasswordRecoveryApiEndpoint);

  signIn(signInCommand: SignInCommand): Observable<SignInResource> {
    return this.#signInEndpoint.signIn(signInCommand);
  }

  recoverPassword(command: PasswordRecoveryCommand): Observable<void> {
    return this.#passwordRecoveryEndpoint.requestRecovery(command);
  }

  signUp(signUpCommand: SignUpCommand): Observable<SignUpResource> {
    return this.#signUpEndpoint.signUp(signUpCommand);
  }
}
