import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { EquipmentHistory } from '../domain/model/equipment-history';
import { EquipmentHistoryApiEndpoint } from '../infrastructure/equipment-history-api-endpoint';

@Injectable({ providedIn: 'root' })
export class EquipmentHistoryStore {
  readonly #api = inject(EquipmentHistoryApiEndpoint);
  readonly #destroyRef = inject(DestroyRef);
  #loadVersion = 0;

  readonly #history = signal<EquipmentHistory | null>(null);
  readonly history = this.#history.asReadonly();
  readonly #loading = signal(false);
  readonly loading = this.#loading.asReadonly();
  readonly #errorKey = signal<string | null>(null);
  readonly errorKey = this.#errorKey.asReadonly();

  load(equipmentId: number): void {
    const version = ++this.#loadVersion;
    this.#history.set(null);
    this.#errorKey.set(null);
    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      this.#loading.set(false);
      this.#errorKey.set('maintenance.history.invalid-id');
      return;
    }

    this.#loading.set(true);
    this.#api.getByEquipmentId(equipmentId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (history) => {
          if (version !== this.#loadVersion) return;
          this.#history.set(history);
          this.#loading.set(false);
        },
        error: (error: unknown) => {
          if (version !== this.#loadVersion) return;
          this.#loading.set(false);
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.#errorKey.set('maintenance.history.not-found');
          } else if (error instanceof HttpErrorResponse && error.status === 403) {
            this.#errorKey.set('maintenance.history.forbidden');
          } else {
            this.#errorKey.set('maintenance.history.load-error');
          }
        },
      });
  }
}
