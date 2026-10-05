import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, switchMap } from 'rxjs';

import { RentalRequest } from '../domain/model/rental-request.entity';

import { RentalsApi } from '../infrastructure/rentals-api';

import { SUBSCRIPTION_ACCESS_PORT } from '../infrastructure/subscription-access.port';

@Injectable({
  providedIn: 'root',
})
export class RentalsStore {
  readonly #rentalsApi = inject(RentalsApi);

  readonly #subscriptionAccess = inject(SUBSCRIPTION_ACCESS_PORT);

  readonly #destroyRef = inject(DestroyRef);

  readonly #latestCreatedRequestSignal = signal<RentalRequest | null>(null);

  readonly latestCreatedRequest = this.#latestCreatedRequestSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);

  readonly loading = this.#loadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  readonly #subscriptionRequiredSignal = signal<boolean>(false);

  readonly subscriptionRequired = this.#subscriptionRequiredSignal.asReadonly();

  createRentalRequest(rentalRequest: RentalRequest): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#subscriptionRequiredSignal.set(false);

    this.#latestCreatedRequestSignal.set(null);

    this.#subscriptionAccess
      .hasActiveSubscription(rentalRequest.rentalCompanyUserId)
      .pipe(
        switchMap((hasActiveSubscription) => {
          if (!hasActiveSubscription) {
            this.#subscriptionRequiredSignal.set(true);

            this.#loadingSignal.set(false);

            return EMPTY;
          }

          return this.#rentalsApi.createRentalRequest(rentalRequest);
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (createdRequest) => {
          this.#latestCreatedRequestSignal.set(createdRequest);

          this.#subscriptionRequiredSignal.set(false);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to create rental request'));

          this.#subscriptionRequiredSignal.set(false);

          this.#loadingSignal.set(false);
        },
      });
  }

  clearCreationState(): void {
    this.#latestCreatedRequestSignal.set(null);

    this.#errorSignal.set(null);

    this.#subscriptionRequiredSignal.set(false);
  }

  #formatError(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
