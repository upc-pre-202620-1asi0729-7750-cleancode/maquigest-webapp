import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HttpErrorResponse } from '@angular/common/http';
import { SubscriptionCheckout } from '../domain/model/subscription-checkout.entity';

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
  #checkoutRequestVersion = 0;
  readonly #checkoutSignal = signal<SubscriptionCheckout | null>(null);
  readonly checkout = this.#checkoutSignal.asReadonly();

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
                subscription.userId === userId && subscription.status === SubscriptionStatus.ACTIVE &&
                subscription.period.endDate.getTime() > Date.now() && subscription.period.startDate.getTime() <= Date.now(),
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
    ++this.#checkoutRequestVersion;
    this.#checkoutSignal.set(null);
    ++this.#subscriptionRequestVersion;
    this.#currentSubscriptionSignal.set(null);
    this.#subscriptionLoadingSignal.set(false);
    this.#subscriptionErrorSignal.set(null);
  }

  subscribeToPlan(userId: number, planId: number): void {
    if (this.#subscriptionLoadingSignal() || this.#currentSubscriptionSignal()) return;
    this.#subscriptionLoadingSignal.set(true);
    this.#subscriptionErrorSignal.set(null);
    const version = ++this.#checkoutRequestVersion;
    this.#subscriptionsApi.createCheckout(planId).pipe(takeUntilDestroyed(this.#destroyRef)).subscribe({
      next: (checkout) => {
        if (version !== this.#checkoutRequestVersion) return;
        this.#checkoutSignal.set(checkout);
        this.#subscriptionLoadingSignal.set(false);
        if (checkout.status === 'PAID') { this.loadCurrentSubscription(userId); return; }
        if (checkout.checkoutUrl && checkout.checkoutUrl.startsWith('https://checkout.stripe.com/')) {
          window.location.assign(checkout.checkoutUrl);
        }
      },
      error: (error) => {
        if (version !== this.#checkoutRequestVersion) return;
        this.#subscriptionErrorSignal.set(this.#formatError(error, 'Failed to start checkout'));
        this.#subscriptionLoadingSignal.set(false);
      },
    });
  }

  confirmCheckout(userId: number, reference: string): void {
    this.#subscriptionLoadingSignal.set(true);
    this.#subscriptionErrorSignal.set(null);
    const version = ++this.#checkoutRequestVersion;
    this.#subscriptionsApi.confirmCheckout(reference).pipe(takeUntilDestroyed(this.#destroyRef)).subscribe({
      next: (checkout) => {
        if (version !== this.#checkoutRequestVersion) return;
        this.#checkoutSignal.set(checkout);
        this.#subscriptionLoadingSignal.set(false);
        this.loadCurrentSubscription(userId);
      },
      error: (error) => {
        if (version !== this.#checkoutRequestVersion) return;
        this.#subscriptionErrorSignal.set(this.#formatError(error, 'Failed to confirm checkout'));
        this.#subscriptionLoadingSignal.set(false);
      },
    });
  }

  cancelCurrentSubscription(): void {
    const current = this.#currentSubscriptionSignal();
    if (!current || this.#subscriptionLoadingSignal()) return;

    this.#subscriptionLoadingSignal.set(true);
    this.#subscriptionErrorSignal.set(null);
    this.#subscriptionsApi.cancelUserSubscription(current.id)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (cancelled) => {
          if (cancelled.status !== SubscriptionStatus.CANCELLED) {
            this.#subscriptionErrorSignal.set('The server did not confirm cancellation');
          } else {
            ++this.#subscriptionRequestVersion;
            // Navigation and route access depend on this signal, so revoke entitlement immediately.
            this.#currentSubscriptionSignal.set(null);
            this.#subscriptionErrorSignal.set(null);
          }
          this.#subscriptionLoadingSignal.set(false);
        },
        error: (error) => {
          this.#subscriptionErrorSignal.set(
            this.#formatError(error, 'Failed to cancel subscription'),
          );
          this.#subscriptionLoadingSignal.set(false);
        },
      });
  }

  #formatError(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') return error.error.detail;
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
