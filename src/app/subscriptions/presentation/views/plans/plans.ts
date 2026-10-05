import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { SubscriptionsStore } from '../../../application/subscriptions.store';

import { SubscriptionPlan } from '../../../domain/model/subscription-plan.entity';

@Component({
  selector: 'app-plans',
  imports: [MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './plans.html',
  styleUrl: './plans.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plans {
  readonly store = inject(SubscriptionsStore);

  readonly #iamStore = inject(IamStore);

  protected readonly selectedPlan = signal<SubscriptionPlan | null>(null);

  protected readonly currentPlan = computed(() => {
    const currentSubscription = this.store.currentSubscription();

    if (!currentSubscription) {
      return undefined;
    }

    return this.store.plans().find((plan) => plan.id === currentSubscription.planId);
  });

  constructor() {
    this.store.loadPlans();

    effect(() => {
      const userId = this.#iamStore.currentUserId();

      if (userId === null) {
        return;
      }

      this.store.loadCurrentSubscription(userId);
    });
  }

  protected isRecommended(plan: SubscriptionPlan): boolean {
    return this.#normalizedName(plan) === 'professional';
  }

  protected isCurrentPlan(plan: SubscriptionPlan): boolean {
    return this.store.currentSubscription()?.planId === plan.id;
  }

  protected selectPlan(plan: SubscriptionPlan): void {
    if (this.store.currentSubscription()) {
      return;
    }

    this.selectedPlan.set(plan);
  }

  protected cancelSelection(): void {
    if (this.store.subscriptionLoading()) {
      return;
    }

    this.selectedPlan.set(null);
  }

  protected confirmSubscription(): void {
    const userId = this.#iamStore.currentUserId();

    const plan = this.selectedPlan();

    if (userId === null || plan === null) {
      return;
    }

    this.store.subscribeToPlan(userId, plan.id);
  }

  protected planNameKey(plan: SubscriptionPlan): string {
    return 'subscriptions.plans.plan-names.' + this.#normalizedName(plan);
  }

  protected descriptionKey(plan: SubscriptionPlan): string {
    return 'subscriptions.plans.descriptions.' + this.#normalizedName(plan);
  }

  protected featureKeys(plan: SubscriptionPlan): string[] {
    const planName = this.#normalizedName(plan);

    if (planName === 'essential') {
      return [
        'subscriptions.plans.features.essential.inventory',
        'subscriptions.plans.features.essential.availability',
        'subscriptions.plans.features.essential.requests',
      ];
    }

    if (planName === 'professional') {
      return [
        'subscriptions.plans.features.professional.essential',
        'subscriptions.plans.features.professional.rentals',
        'subscriptions.plans.features.professional.payments',
        'subscriptions.plans.features.professional.delivery-return',
      ];
    }

    if (planName === 'growth') {
      return [
        'subscriptions.plans.features.growth.professional',
        'subscriptions.plans.features.growth.incidents',
        'subscriptions.plans.features.growth.scheduling',
        'subscriptions.plans.features.growth.history',
      ];
    }

    return [];
  }

  protected subscriptionStatusKey(): string {
    const status = this.store.currentSubscription()?.status;

    if (!status) {
      return '';
    }

    return 'subscriptions.plans.subscription-status.' + status.toLowerCase();
  }

  protected formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  #normalizedName(plan: SubscriptionPlan): string {
    return plan.name.trim().toLowerCase();
  }
}
