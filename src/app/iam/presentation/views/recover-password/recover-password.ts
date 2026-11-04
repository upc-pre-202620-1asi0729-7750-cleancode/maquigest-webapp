import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { PasswordRecoveryService } from '../../../application/password-recovery.service';
import { PasswordRecoveryCommand } from '../../../domain/model/password-recovery.command';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

@Component({
  selector: 'app-recover-password',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, TranslatePipe, LanguageSwitcher],
  templateUrl: './recover-password.html',
  styleUrl: './recover-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoverPassword {
  readonly #recovery = inject(PasswordRecoveryService);
  readonly #destroyRef = inject(DestroyRef);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  protected readonly sending = signal(false);
  protected readonly messageKey = signal<string | null>(null);
  protected readonly success = signal(false);

  protected sendRecoveryRequest(): void {
    if (this.sending() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.messageKey.set(null);
    this.success.set(false);
    this.sending.set(true);
    const command = new PasswordRecoveryCommand(this.form.controls.email.value.trim());
    this.#recovery.requestRecovery(command).pipe(
      finalize(() => this.sending.set(false)),
      takeUntilDestroyed(this.#destroyRef),
    ).subscribe({
      next: () => {
        this.success.set(true);
        this.messageKey.set('iam.recovery.success');
      },
      error: (error: HttpErrorResponse) => {
        this.messageKey.set(
          error.status === 501 || error.status === 404
            ? 'iam.recovery.unavailable'
            : 'iam.recovery.error',
        );
      },
    });
  }
}
