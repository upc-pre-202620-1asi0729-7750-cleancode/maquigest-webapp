import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

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

  constructor() {
    this.store.loadPlans();
  }

  isRecommended(plan: SubscriptionPlan): boolean {
    return this.#normalizedName(plan) === 'professional';
  }

  planNameKey(plan: SubscriptionPlan): string {
    return 'subscriptions.plans.plan-names.' + this.#normalizedName(plan);
  }

  descriptionKey(plan: SubscriptionPlan): string {
    return 'subscriptions.plans.descriptions.' + this.#normalizedName(plan);
  }

  featureKeys(plan: SubscriptionPlan): string[] {
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

  #normalizedName(plan: SubscriptionPlan): string {
    return plan.name.trim().toLowerCase();
  }
}
