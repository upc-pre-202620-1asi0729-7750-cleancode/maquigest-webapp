import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';

import { SignUpCommand } from '../../../domain/model/sign-up.command';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';

import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;

  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : {
        passwordsMismatch: true,
      };
}

function fullNameValidator(control: AbstractControl): ValidationErrors | null {
  const fullName = String(control.value ?? '').trim();

  const parts = fullName.split(/\s+/);

  return parts.length >= 2
    ? null
    : {
        fullNameIncomplete: true,
      };
}

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, TranslatePipe, LanguageSwitcher],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUp extends BaseForm {
  readonly #router = inject(Router);

  readonly #store = inject(IamStore);

  protected readonly form = new FormGroup(
    {
      fullName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, fullNameValidator],
      }),

      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),

      companyName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),

      role: new FormControl('rental_company', {
        nonNullable: true,
        validators: [Validators.required],
      }),

      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),

      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    {
      validators: [passwordsMatchValidator],
    },
  );

  protected performSignUp(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();

    const nameParts = values.fullName.trim().split(/\s+/);

    const firstName = nameParts.shift() ?? '';

    const lastName = nameParts.join(' ');

    const signUpCommand = new SignUpCommand({
      firstName,
      lastName,
      email: values.email,
      password: values.password,
      companyName: values.companyName,
      role: values.role,
    });

    this.#store.signUp(signUpCommand, this.#router);
  }
}
