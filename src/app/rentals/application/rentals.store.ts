import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RentalRequest } from '../domain/model/rental-request.entity';

import { RentalsApi } from '../infrastructure/rentals-api';

@Injectable({
  providedIn: 'root',
})
export class RentalsStore {
  readonly #rentalsApi = inject(RentalsApi);

  readonly #destroyRef = inject(DestroyRef);

  readonly #latestCreatedRequestSignal = signal<RentalRequest | null>(null);

  readonly latestCreatedRequest = this.#latestCreatedRequestSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);

  readonly loading = this.#loadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  createRentalRequest(rentalRequest: RentalRequest): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);
    this.#latestCreatedRequestSignal.set(null);

    this.#rentalsApi
      .createRentalRequest(rentalRequest)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (createdRequest) => {
          this.#latestCreatedRequestSignal.set(createdRequest);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to create rental request'));

          this.#loadingSignal.set(false);
        },
      });
  }

  clearCreationState(): void {
    this.#latestCreatedRequestSignal.set(null);

    this.#errorSignal.set(null);
  }

  #formatError(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
