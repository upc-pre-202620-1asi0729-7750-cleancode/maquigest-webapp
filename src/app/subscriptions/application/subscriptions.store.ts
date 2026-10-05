import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';

import { PlanStatus } from '../domain/model/plan-status.enum';

import { SubscriptionsApi } from '../infrastructure/subscriptions-api';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionsStore {
  readonly #subscriptionsApi = inject(SubscriptionsApi);

  readonly #destroyRef = inject(DestroyRef);

  readonly #plansSignal = signal<SubscriptionPlan[]>([]);

  readonly plans = this.#plansSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);

  readonly loading = this.#loadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  loadPlans(): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#subscriptionsApi
      .getSubscriptionPlans()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (plans) => {
          this.#plansSignal.set(plans.filter((plan) => plan.status === PlanStatus.ACTIVE));

          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.#plansSignal.set([]);

          this.#errorSignal.set(this.#formatError(error, 'Failed to load subscription plans'));

          this.#loadingSignal.set(false);
        },
      });
  }

  #formatError(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
