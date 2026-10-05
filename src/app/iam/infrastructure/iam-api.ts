import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SignInCommand } from '../domain/model/sign-in.command';
import { SIGN_IN_PORT } from './sign-in.port';
import { SignInResource } from './sign-in-response';

@Injectable({
  providedIn: 'root',
})
export class IamApi {
  readonly #signInEndpoint = inject(SIGN_IN_PORT);

  signIn(signInCommand: SignInCommand): Observable<SignInResource> {
    return this.#signInEndpoint.signIn(signInCommand);
  }
}
