import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../application/iam.store';
import { SignUpCommand } from '../../../domain/model/sign-up.command';

@Component({
  selector: 'app-sign-up',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp {
  readonly #store = inject(IamStore);

  protected readonly form = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),

    companyName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    role: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected performSignUp(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();

    const signUpCommand = new SignUpCommand({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      companyName: values.companyName,
      role: values.role,
    });

    this.#store.signUp(signUpCommand);
  }
}
