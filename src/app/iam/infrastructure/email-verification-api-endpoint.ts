import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { VerifyEmailCommand } from '../domain/model/verify-email.command';
@Injectable({ providedIn: 'root' })
export class EmailVerificationApiEndpoint {
  readonly #http = inject(HttpClient);
  readonly #base = environment.platformProviderApiBaseUrl.replace(/\/+$/, '') + '/authentication';
  verify(command: VerifyEmailCommand) { return this.#http.post<void>(`${this.#base}/verify-email`, { token: command.token, password: command.password }); }
  resend(email: string) { return this.#http.post<void>(`${this.#base}/resend-email-verification`, { email }); }
}
