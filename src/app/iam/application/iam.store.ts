import { computed, inject, Injectable, signal } from '@angular/core';

import { Router } from '@angular/router';

import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';

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

  constructor() {
    this.#restoreSession();
  }

  signIn(signInCommand: SignInCommand, router: Router): void {
    this.#iamApi.signIn(signInCommand).subscribe({
      next: (signInResource) => {
        localStorage.setItem('token', signInResource.token);

        localStorage.setItem('userId', String(signInResource.id));

        localStorage.setItem('email', signInResource.email);

        localStorage.setItem('role', signInResource.role);

        localStorage.setItem('status', signInResource.status);

        this.#isSignedInSignal.set(true);

        this.#currentUserIdSignal.set(signInResource.id);

        this.#currentEmailSignal.set(signInResource.email);

        this.#currentRoleSignal.set(signInResource.role);

        this.#currentStatusSignal.set(signInResource.status);

        router.navigate(['/dashboard']).then();
      },

      error: (err) => {
        console.error('Sign-in failed:', err);

        this.#clearPersistedSession();
        this.#clearSessionState();

        router.navigate(['/iam/sign-in']).then();
      },
    });
  }

  signUp(signUpCommand: SignUpCommand, router: Router): void {
    this.#iamApi.signUp(signUpCommand).subscribe({
      next: () => {
        router
          .navigate(['/iam/sign-in'], {
            state: {
              registrationSuccess: true,
            },
          })
          .then();
      },

      error: (err) => {
        console.error('Sign-up failed:', err);

        this.#clearPersistedSession();
        this.#clearSessionState();

        router.navigate(['/iam/sign-up']).then();
      },
    });
  }

  signOut(router: Router): void {
    this.#clearPersistedSession();
    this.#clearSessionState();

    router.navigate(['/iam/sign-in']).then();
  }

  #restoreSession(): void {
    const token = localStorage.getItem('token');

    const userId = localStorage.getItem('userId');

    const email = localStorage.getItem('email');

    const role = localStorage.getItem('role');

    const status = localStorage.getItem('status');

    if (!token || !userId || !email || !role || !status) {
      return;
    }

    this.#isSignedInSignal.set(true);

    this.#currentUserIdSignal.set(Number(userId));

    this.#currentEmailSignal.set(email);

    this.#currentRoleSignal.set(role);

    this.#currentStatusSignal.set(status);
  }

  #clearPersistedSession(): void {
    localStorage.removeItem('token');

    localStorage.removeItem('userId');

    localStorage.removeItem('email');

    localStorage.removeItem('role');

    localStorage.removeItem('status');
  }

  #clearSessionState(): void {
    this.#isSignedInSignal.set(false);

    this.#currentUserIdSignal.set(null);

    this.#currentEmailSignal.set(null);

    this.#currentRoleSignal.set(null);

    this.#currentStatusSignal.set(null);
  }
}
