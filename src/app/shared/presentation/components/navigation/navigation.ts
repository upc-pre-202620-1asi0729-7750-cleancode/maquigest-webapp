import { Component, computed, inject, output } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

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

  readonly optionSelected = output<void>();

  protected readonly primaryOptions = computed<NavigationOption[]>(() => {
    const role = this.store.currentRole();

    const dashboard = {
      link: '/dashboard',

      label: 'navigation.dashboard',
    };

    if (role === 'rental_company') {
      return [
        dashboard,
        {
          link: '/inventory/equipment',

          label: 'navigation.equipment',
        },
        {
          link: '/rentals/requests',

          label: 'navigation.rental-requests',
        },
      ];
    }

    if (role === 'construction_company') {
      return [
        dashboard,
        {
          link: '/inventory/search',

          label: 'navigation.search-equipment',
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
