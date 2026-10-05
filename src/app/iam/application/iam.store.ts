import { computed, inject, Injectable, signal } from '@angular/core';

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
}
