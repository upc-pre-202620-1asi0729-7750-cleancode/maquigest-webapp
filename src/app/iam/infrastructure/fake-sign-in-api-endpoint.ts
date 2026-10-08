import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInPort } from './sign-in.port';
import { SignInResource } from './sign-in-response';

interface FakeUserRecord {
  id: number;
  email: string;
  password: string;
  role: string;
  status: string;
}

const usersEndpointUrl = `${environment.platformProviderApiBaseUrl}/users`;

export class FakeSignInApiEndpoint implements SignInPort {
  readonly #http = inject(HttpClient);

  signIn(signInCommand: SignInCommand): Observable<SignInResource> {
    const params = new HttpParams()
      .set('email', signInCommand.email)
      .set('password', signInCommand.password);

    return this.#http.get<FakeUserRecord[]>(usersEndpointUrl, { params }).pipe(
      map((users) => {
        if (users.length === 0) {
          throw new Error('Invalid email or password');
        }

        const user = users[0];

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          token: String(user.id),
        };
      }),
      catchError((error) => throwError(() => new Error(`Failed to sign-in: ${error.message}`))),
    );
  }
}
