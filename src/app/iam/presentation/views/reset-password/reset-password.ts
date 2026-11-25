import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { PasswordRecoveryService } from '../../../application/password-recovery.service';
import { IamStore } from '../../../application/iam.store';
import { ResetPasswordCommand } from '../../../domain/model/reset-password.command';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, TranslatePipe, LanguageSwitcher],
  templateUrl: './reset-password.html',
  styleUrl: '../recover-password/recover-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  readonly #service = inject(PasswordRecoveryService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #router = inject(Router);
  readonly #store = inject(IamStore);
  #token = new URLSearchParams(inject(ActivatedRoute).snapshot.fragment ?? '').get('token') ?? '';
  protected readonly validLink = signal(/^[A-Za-z0-9_-]{43}$/.test(this.#token));
  protected readonly busy = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly completed = signal(false);
  protected readonly form = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)] }),
    confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  constructor() { inject(Location).replaceState('/iam/reset-password'); }
  protected submit(): void {
    if (!this.validLink() || this.busy() || this.completed() || this.form.invalid) return;
    const { password, confirm } = this.form.getRawValue();
    if (password !== confirm || !password.trim() || new TextEncoder().encode(password).length > 72) {
      this.message.set('iam.reset.invalid-password'); return;
    }
    this.busy.set(true); this.message.set(null);
    this.#service.resetPassword(new ResetPasswordCommand(this.#token, password)).pipe(
      finalize(() => this.busy.set(false)), takeUntilDestroyed(this.#destroyRef),
    ).subscribe({
      next: () => { this.#token = ''; this.form.reset(); this.completed.set(true); this.message.set('iam.reset.success'); },
      error: () => this.message.set('iam.reset.error'),
    });
  }
  protected signIn(): void { this.#store.signOut(this.#router); }
}
