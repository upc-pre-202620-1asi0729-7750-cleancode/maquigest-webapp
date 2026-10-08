import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInResource } from './sign-in-response';

export interface SignInPort {
  signIn(signInCommand: SignInCommand): Observable<SignInResource>;
}

export const SIGN_IN_PORT = new InjectionToken<SignInPort>('SIGN_IN_PORT');
