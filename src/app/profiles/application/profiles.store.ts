import { computed, inject, Injectable, Signal, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';

import { CompanyProfile } from '../domain/model/company-profile.entity';
import { ProfilesApi } from '../infrastructure/profiles-api';

@Injectable({
  providedIn: 'root',
})
export class ProfilesStore {
  readonly #profilesApi = inject(ProfilesApi);

  readonly #profilesSignal = signal<CompanyProfile[]>([]);
  readonly profiles = this.#profilesSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);
  readonly loading = this.#loadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);
  readonly error = this.#errorSignal.asReadonly();

  constructor() {
    this.#loadProfiles();
  }

  getProfileByUserId(userId: number): Signal<CompanyProfile | undefined> {
    return computed(() => this.profiles().find((profile) => profile.userId === userId));
  }

  updateProfile(updatedProfile: CompanyProfile): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#profilesApi
      .updateProfile(updatedProfile)
      .pipe(retry(2))
      .subscribe({
        next: (profile) => {
          this.#profilesSignal.update((profiles) =>
            profiles.map((current) => (current.id === profile.id ? profile : current)),
          );

          this.#loadingSignal.set(false);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to update profile'));

          this.#loadingSignal.set(false);
        },
      });
  }

  #loadProfiles(): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#profilesApi
      .getProfiles()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (profiles) => {
          this.#profilesSignal.set(profiles);
          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to load profiles'));

          this.#loadingSignal.set(false);
        },
      });
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
