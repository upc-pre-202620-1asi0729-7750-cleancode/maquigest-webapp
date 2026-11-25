import { inject, Injectable, signal } from '@angular/core';

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

  readonly #currentTokenSignal = signal<string | null>(null);

  readonly currentToken = this.#currentTokenSignal.asReadonly();

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

        this.#currentTokenSignal.set(signInResource.token);
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
      next: (account) => {
        if (account.status === 'pending_email_verification') {
          router.navigate(['/iam/verify-email'], { state: { verificationPending: true } }).then();
          return;
        }
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

    if (!token || !userId || !email || !role || !status ||
        !Number.isSafeInteger(Number(userId)) || Number(userId) < 1 ||
        !this.#hasUnexpiredToken(token)) {
      this.#clearPersistedSession();
      return;
    }

    this.#currentTokenSignal.set(token);
    this.#isSignedInSignal.set(true);

    this.#currentUserIdSignal.set(Number(userId));

    this.#currentEmailSignal.set(email);

    this.#currentRoleSignal.set(role);

    this.#currentStatusSignal.set(status);
  }

  // A local expiry check is only a UX hint; the server verifies signature and authorization.
  #hasUnexpiredToken(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || parts.some(part => !part)) return false;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
      return typeof claims.exp === 'number' && Number.isFinite(claims.exp) && claims.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  #clearPersistedSession(): void {
    localStorage.removeItem('token');

    localStorage.removeItem('userId');

    localStorage.removeItem('email');

    localStorage.removeItem('role');

    localStorage.removeItem('status');
  }

  #clearSessionState(): void {
    this.#currentTokenSignal.set(null);
    this.#isSignedInSignal.set(false);

    this.#currentUserIdSignal.set(null);

    this.#currentEmailSignal.set(null);

    this.#currentRoleSignal.set(null);

    this.#currentStatusSignal.set(null);
  }
}
