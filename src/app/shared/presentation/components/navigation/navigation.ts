import { Component, computed, effect, inject, output } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionsStore } from '../../../../subscriptions/application/subscriptions.store';

interface NavigationOption {
  link: string;
  label: string;
}

@Component({
  selector: 'app-navigation',

  imports: [RouterLink, RouterLinkActive, TranslatePipe],

  templateUrl: './navigation.html',

  styleUrl: './navigation.css',
})
export class Navigation {
  protected readonly store = inject(IamStore);
  protected readonly subscriptions = inject(SubscriptionsStore);

  constructor() {
    effect(() => {
      const role = this.store.currentRole();
      const userId = this.store.currentUserId();
      if (role === 'rental_company' && userId !== null) {
        this.subscriptions.loadCurrentSubscription(userId);
      } else {
        this.subscriptions.clearCurrentSubscription();
      }
    });
  }

  readonly optionSelected = output<void>();

  protected readonly primaryOptions = computed<NavigationOption[]>(() => {
    const role = this.store.currentRole();

    const dashboard = {
      link: '/dashboard',
      label: 'navigation.dashboard',
    };

    if (role === 'rental_company') {
      const subscription = this.subscriptions.currentSubscription();
      const planId = subscription && subscription.userId === this.store.currentUserId() &&
        subscription.period.contains(new Date()) ? subscription.planId : 0;
      const options: NavigationOption[] = [dashboard];
      if (planId >= 1) {
        options.push({ link: '/inventory/equipment', label: 'navigation.equipment' });
        options.push({ link: '/rentals/requests', label: 'navigation.rental-requests' });
      }
      if (planId >= 2) {
        options.push({ link: '/rentals/active', label: 'navigation.rentals' });
      }
      if (planId >= 3) {
        options.push({ link: '/maintenance', label: 'navigation.maintenance' });
      }
      return options;
    }

    if (role === 'construction_company') {
      return [
        dashboard,
        {
          link: '/inventory/search',
          label: 'navigation.search-equipment',
        },
        {
          link: '/rentals/my-requests',
          label: 'navigation.my-requests',
        },
      ];
    }

    return [dashboard];
  });

  protected readonly utilityOptions = computed<NavigationOption[]>(() => {
    const role = this.store.currentRole();

    const profile = {
      link: '/profiles/profile',
      label: 'navigation.profile',
    };

    if (role === 'rental_company') {
      return [
        {
          link: '/subscriptions/plans',
          label: 'navigation.plan-subscription',
        },
        profile,
      ];
    }

    return [profile];
  });

  protected selectOption(): void {
    this.optionSelected.emit();
  }
}
