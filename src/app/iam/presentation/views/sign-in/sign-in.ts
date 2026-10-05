import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';

import { SignInCommand } from '../../../domain/model/sign-in.command';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';

import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

@Component({
  selector: 'app-sign-in',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    LanguageSwitcher,
  ],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignIn extends BaseForm {
  readonly #router = inject(Router);

  readonly #store = inject(IamStore);

  protected readonly registrationSuccess = history.state?.['registrationSuccess'] === true;

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected performSignIn(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();

    const signInCommand = new SignInCommand({
      email,
      password,
    });

    this.#store.signIn(signInCommand, this.#router);
  }
}
