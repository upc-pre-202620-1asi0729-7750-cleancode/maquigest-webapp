import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PasswordRecoveryCommand } from '../domain/model/password-recovery.command';
import { ResetPasswordCommand } from '../domain/model/reset-password.command';
import { IamApi } from '../infrastructure/iam-api';

/** Application orchestration; no mail provider or password logic runs in Angular. */
@Injectable({ providedIn: 'root' })
export class PasswordRecoveryService {
  private readonly iamApi = inject(IamApi);

  resetPassword(command: ResetPasswordCommand): Observable<void> {
    return this.iamApi.resetPassword(command);
  }

  requestRecovery(command: PasswordRecoveryCommand): Observable<void> {
    return this.iamApi.recoverPassword(command);
  }
}
