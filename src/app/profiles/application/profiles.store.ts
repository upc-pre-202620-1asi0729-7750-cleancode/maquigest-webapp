import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';

import { CompanyProfile } from '../domain/model/company-profile.entity';
import { ProfilesApi } from '../infrastructure/profiles-api';

@Injectable({
  providedIn: 'root',
})
export class ProfilesStore {
  readonly #profilesApi = inject(ProfilesApi);
  readonly #destroyRef = inject(DestroyRef);

  readonly #profileSignal = signal<CompanyProfile | undefined>(undefined);
  readonly profile = this.#profileSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);
  readonly loading = this.#loadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);
  readonly error = this.#errorSignal.asReadonly();

  loadProfileByUserId(userId: number): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#profilesApi
      .getProfileByUserId(userId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (profile) => {
          this.#profileSignal.set(profile);
          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);
        },

        error: (err) => {
          this.#profileSignal.set(undefined);

          this.#errorSignal.set(this.#formatError(err, 'Failed to load profile'));

          this.#loadingSignal.set(false);
        },
      });
  }

  updateProfile(updatedProfile: CompanyProfile): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#profilesApi
      .updateProfile(updatedProfile)
      .pipe(retry(2), takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (profile) => {
          this.#profileSignal.set(profile);
          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to update profile'));

          this.#loadingSignal.set(false);
        },
      });
  }

  clearProfile(): void {
    this.#profileSignal.set(undefined);
    this.#errorSignal.set(null);
    this.#loadingSignal.set(false);
  }

  #formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }

    return fallback;
  }
}
