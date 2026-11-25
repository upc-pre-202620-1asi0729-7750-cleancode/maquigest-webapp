import { inject, Injectable } from '@angular/core';
import { EmailVerificationApiEndpoint } from '../infrastructure/email-verification-api-endpoint';
import { VerifyEmailCommand } from '../domain/model/verify-email.command';
@Injectable({ providedIn: 'root' })
export class EmailVerificationService {
  readonly #api = inject(EmailVerificationApiEndpoint);
  verify(command: VerifyEmailCommand) { return this.#api.verify(command); }
  resend(email: string) { return this.#api.resend(email); }
}
