import { computed, inject, Injectable, signal } from '@angular/core';

import { SignInCommand } from '../domain/model/sign-in.command';
import { IamApi } from '../infrastructure/iam-api';

@Injectable({
  providedIn: 'root',
})
export class IamStore {
  readonly #iamApi = inject(IamApi);

  readonly #isSignedInSignal = signal<boolean>(false);
  readonly #currentUserIdSignal = signal<number | null>(null);
  readonly #currentEmailSignal = signal<string | null>(null);
  readonly #currentRoleSignal = signal<string | null>(null);
  readonly #currentStatusSignal = signal<string | null>(null);

  readonly isSignedIn = this.#isSignedInSignal.asReadonly();

  readonly currentUserId = this.#currentUserIdSignal.asReadonly();

  readonly currentEmail = this.#currentEmailSignal.asReadonly();

  readonly currentRole = this.#currentRoleSignal.asReadonly();

  readonly currentStatus = this.#currentStatusSignal.asReadonly();

  readonly currentToken = computed(() =>
    this.isSignedIn() ? localStorage.getItem('token') : null,
  );

  signIn(signInCommand: SignInCommand): void {
    this.#iamApi.signIn(signInCommand).subscribe({
      next: (signInResource) => {
        localStorage.setItem('token', signInResource.token);

        this.#isSignedInSignal.set(true);
        this.#currentUserIdSignal.set(signInResource.id);
        this.#currentEmailSignal.set(signInResource.email);
        this.#currentRoleSignal.set(signInResource.role);
        this.#currentStatusSignal.set(signInResource.status);
      },

      error: (err) => {
        console.error('Sign-in failed:', err);

        localStorage.removeItem('token');

        this.#isSignedInSignal.set(false);
        this.#currentUserIdSignal.set(null);
        this.#currentEmailSignal.set(null);
        this.#currentRoleSignal.set(null);
        this.#currentStatusSignal.set(null);
      },
    });
  }
}
