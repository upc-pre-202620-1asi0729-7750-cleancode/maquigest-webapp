import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { SubscriptionPlan } from '../../../domain/model/subscription-plan.entity';

@Component({
  selector: 'app-change-plan',
  imports: [TranslatePipe],
  templateUrl: './change-plan.html',
  styleUrl: './change-plan.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePlan {
  readonly selectedPlan = input.required<SubscriptionPlan>();

  readonly currentPlan = input<SubscriptionPlan | null>(null);

  readonly loading = input<boolean>(false);

  readonly error = input<string | null>(null);

  readonly confirmed = output<void>();

  readonly cancelled = output<void>();

  protected readonly isChangingPlan = computed(() => this.currentPlan() !== null);

  protected confirm(): void {
    if (this.loading()) {
      return;
    }

    this.confirmed.emit();
  }

  protected cancel(): void {
    if (this.loading()) {
      return;
    }

    this.cancelled.emit();
  }

  protected planNameKey(plan: SubscriptionPlan): string {
    return 'subscriptions.plans.plan-names.' + this.#normalizedName(plan);
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

  #normalizedName(plan: SubscriptionPlan): string {
    return plan.name.trim().toLowerCase();
  }
}
