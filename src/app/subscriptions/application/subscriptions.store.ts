import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DateRange } from '../../shared/domain/value-object/date-range.value-object';

import { PlanStatus } from '../domain/model/plan-status.enum';

import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';

import { SubscriptionStatus } from '../domain/model/subscription-status.enum';

import { UserSubscription } from '../domain/model/user-subscription.entity';

import { SubscriptionsApi } from '../infrastructure/subscriptions-api';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionsStore {
  readonly #subscriptionsApi = inject(SubscriptionsApi);
  #subscriptionRequestVersion = 0;

  readonly #destroyRef = inject(DestroyRef);

  readonly #plansSignal = signal<SubscriptionPlan[]>([]);

  readonly plans = this.#plansSignal.asReadonly();

  readonly #currentSubscriptionSignal = signal<UserSubscription | null>(null);

  readonly currentSubscription = this.#currentSubscriptionSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);

  readonly loading = this.#loadingSignal.asReadonly();

  readonly #subscriptionLoadingSignal = signal<boolean>(false);

  readonly subscriptionLoading = this.#subscriptionLoadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  readonly #subscriptionErrorSignal = signal<string | null>(null);

  readonly subscriptionError = this.#subscriptionErrorSignal.asReadonly();

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

  loadCurrentSubscription(userId: number): void {
    const requestVersion = ++this.#subscriptionRequestVersion;
    this.#currentSubscriptionSignal.set(null);
    this.#subscriptionLoadingSignal.set(true);

    this.#subscriptionErrorSignal.set(null);

    this.#subscriptionsApi
      .getUserSubscriptions()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (subscriptions) => {
          if (requestVersion !== this.#subscriptionRequestVersion) return;
          const currentSubscription =
            subscriptions.find(
              (subscription) =>
                subscription.userId === userId && subscription.status === SubscriptionStatus.ACTIVE,
            ) ?? null;

          this.#currentSubscriptionSignal.set(currentSubscription);

          this.#subscriptionLoadingSignal.set(false);

          this.#subscriptionErrorSignal.set(null);
        },

        error: (error) => {
          if (requestVersion !== this.#subscriptionRequestVersion) return;
          this.#currentSubscriptionSignal.set(null);

          this.#subscriptionErrorSignal.set(
            this.#formatError(error, 'Failed to load current subscription'),
          );

          this.#subscriptionLoadingSignal.set(false);
        },
      });
  }

  clearCurrentSubscription(): void {
    ++this.#subscriptionRequestVersion;
    this.#currentSubscriptionSignal.set(null);
    this.#subscriptionLoadingSignal.set(false);
    this.#subscriptionErrorSignal.set(null);
  }

  subscribeToPlan(userId: number, planId: number): void {
    if (this.#currentSubscriptionSignal()) {
      this.#subscriptionErrorSignal.set('The user already has an active subscription');

      return;
    }

    const plan = this.#plansSignal().find((currentPlan) => currentPlan.id === planId);

    if (!plan || plan.status !== PlanStatus.ACTIVE) {
      this.#subscriptionErrorSignal.set('The selected plan is not available');

      return;
    }

    this.#subscriptionLoadingSignal.set(true);

    this.#subscriptionErrorSignal.set(null);

    const startDate = new Date();

    const endDate = this.#calculateMonthlyEndDate(startDate);

    const subscription = new UserSubscription({
      id: 0,

      userId,

      planId,

      period: new DateRange({
        startDate,
        endDate,
      }),

      status: SubscriptionStatus.ACTIVE,

      autoRenew: true,
    });

    this.#subscriptionsApi
      .createUserSubscription(subscription)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (createdSubscription) => {
          this.#currentSubscriptionSignal.set(createdSubscription);

          this.#subscriptionLoadingSignal.set(false);

          this.#subscriptionErrorSignal.set(null);
        },

        error: (error) => {
          this.#subscriptionErrorSignal.set(
            this.#formatError(error, 'Failed to create subscription'),
          );

          this.#subscriptionLoadingSignal.set(false);
        },
      });
  }

  changePlan(planId: number): void {
    const currentSubscription = this.#currentSubscriptionSignal();

    if (!currentSubscription) {
      this.#subscriptionErrorSignal.set('There is no active subscription to update');

      return;
    }

    if (currentSubscription.planId === planId) {
      this.#subscriptionErrorSignal.set('The selected plan is already the current plan');

      return;
    }

    const selectedPlan = this.#plansSignal().find((plan) => plan.id === planId);

    if (!selectedPlan || selectedPlan.status !== PlanStatus.ACTIVE) {
      this.#subscriptionErrorSignal.set('The selected plan is not available');

      return;
    }

    this.#subscriptionLoadingSignal.set(true);

    this.#subscriptionErrorSignal.set(null);

    const updatedSubscription = new UserSubscription({
      id: currentSubscription.id,

      userId: currentSubscription.userId,

      planId,

      period: currentSubscription.period,

      status: currentSubscription.status,

      autoRenew: currentSubscription.autoRenew,
    });

    this.#subscriptionsApi
      .updateUserSubscription(updatedSubscription)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (subscription) => {
          this.#currentSubscriptionSignal.set(subscription);

          this.#subscriptionLoadingSignal.set(false);

          this.#subscriptionErrorSignal.set(null);
        },

        error: (error) => {
          this.#subscriptionErrorSignal.set(
            this.#formatError(error, 'Failed to update subscription'),
          );

          this.#subscriptionLoadingSignal.set(false);
        },
      });
  }

  #calculateMonthlyEndDate(startDate: Date): Date {
    const result = new Date(startDate);

    const originalDay = result.getDate();

    result.setDate(1);

    result.setMonth(result.getMonth() + 1);

    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();

    result.setDate(Math.min(originalDay, lastDay));

    return result;
  }

  #formatError(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
