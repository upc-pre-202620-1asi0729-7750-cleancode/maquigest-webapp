import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { EmailVerificationService } from '../../../application/email-verification.service';
import { VerifyEmailCommand } from '../../../domain/model/verify-email.command';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
@Component({ selector:'app-verify-email', imports:[ReactiveFormsModule,RouterLink,MatButtonModule,TranslatePipe,LanguageSwitcher],
  templateUrl:'./verify-email.html', styleUrl:'../recover-password/recover-password.css', changeDetection:ChangeDetectionStrategy.OnPush })
export class VerifyEmail {
  readonly #service = inject(EmailVerificationService);
  readonly #destroy = inject(DestroyRef);
  #token = new URLSearchParams(inject(ActivatedRoute).snapshot.fragment ?? '').get('token') ?? '';
  protected readonly validLink = signal(/^[A-Za-z0-9_-]{43}$/.test(this.#token));
  protected readonly busy = signal(false);
  protected readonly completed = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly password = new FormControl('', {nonNullable:true,validators:[Validators.required,Validators.maxLength(72)]});
  protected readonly email = new FormControl('', {nonNullable:true,validators:[Validators.required,Validators.email]});
  protected readonly verificationForm = new FormGroup({ password: this.password });
  protected readonly resendForm = new FormGroup({ email: this.email });
  constructor() { inject(Location).replaceState('/iam/verify-email'); }
  protected verify(): void {
    if (!this.validLink() || this.busy() || this.completed() || this.password.invalid) return;
    this.busy.set(true);this.message.set(null);
    this.#service.verify(new VerifyEmailCommand(this.#token,this.password.value)).pipe(finalize(()=>this.busy.set(false)),takeUntilDestroyed(this.#destroy)).subscribe({
      next:()=>{this.#token='';this.password.reset();this.completed.set(true);this.message.set('iam.verification.success');},
      error:()=>this.message.set('iam.verification.error'),
    });
  }
  protected resend(): void {
    if(this.email.invalid || this.busy()) return;
    this.busy.set(true);this.message.set(null);
    this.#service.resend(this.email.value).pipe(finalize(()=>this.busy.set(false)),takeUntilDestroyed(this.#destroy)).subscribe({
      next:()=>this.message.set('iam.verification.resent'),error:()=>this.message.set('iam.verification.unavailable'),
    });
  }
}
