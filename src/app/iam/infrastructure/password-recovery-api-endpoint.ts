import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PasswordRecoveryCommand } from '../domain/model/password-recovery.command';
import { ResetPasswordCommand } from '../domain/model/reset-password.command';

const passwordRecoveryUrl =
  `${environment.platformProviderApiBaseUrl}${environment.platformProviderPasswordRecoveryEndpointPath}`;

/** HTTP adapter: the backend owns tokens, account lookup and SendGrid integration. */
@Injectable({ providedIn: 'root' })
export class PasswordRecoveryApiEndpoint {
  private readonly http = inject(HttpClient);

  resetPassword(command: ResetPasswordCommand): Observable<void> {
    return this.http.post<void>(`${environment.platformProviderApiBaseUrl}/authentication/reset-password`, {
      token: command.token, password: command.password,
    });
  }

  requestRecovery(command: PasswordRecoveryCommand): Observable<void> {
    return this.http.post<void>(passwordRecoveryUrl, { email: command.email });
  }
}
