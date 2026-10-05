import { Component, computed, inject } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, TranslatePipe],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation {
  protected readonly store = inject(IamStore);

  protected readonly options = computed(() => {
    const role = this.store.currentRole();

    const dashboard = {
      link: '/dashboard',
      label: 'navigation.dashboard',
    };

    const profile = {
      link: '/profiles/profile',
      label: 'navigation.profile',
    };

    if (role === 'rental_company') {
      return [
        dashboard,
        {
          link: '/inventory/equipment',
          label: 'navigation.equipment',
        },
        profile,
      ];
    }

    if (role === 'construction_company') {
      return [
        dashboard,
        {
          link: '/inventory/search',
          label: 'navigation.search-equipment',
        },
        profile,
      ];
    }

    return [dashboard, profile];
  });
}
