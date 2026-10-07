import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { toSignal } from '@angular/core/rxjs-interop';

import { filter, map, startWith } from 'rxjs';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { Navigation } from '../navigation/navigation';

import { LanguageSwitcher } from '../language-switcher/language-switcher';

import { Footer } from '../footer/footer';

@Component({
  selector: 'app-layout',

  imports: [RouterOutlet, Navigation, LanguageSwitcher, Footer, TranslatePipe],

  templateUrl: './layout.html',

  styleUrl: './layout.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  protected readonly store = inject(IamStore);

  readonly #router = inject(Router);

  protected readonly mobileMenuOpen = signal<boolean>(false);

  readonly #currentUrl = toSignal(
    this.#router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),

      map(() => this.#router.url),

      startWith(this.#router.url),
    ),

    {
      initialValue: this.#router.url,
    },
  );

  protected readonly isAuthenticationPage = computed(() => this.#currentUrl().startsWith('/iam/'));

  protected readonly companyLabelKey = computed(() => {
    const role = this.store.currentRole();

    if (role === 'rental_company') {
      return 'dashboard.rental-company';
    }

    if (role === 'construction_company') {
      return 'dashboard.construction-company';
    }

    return 'app.name';
  });

  protected readonly companyInitials = computed(() => {
    const role = this.store.currentRole();

    if (role === 'rental_company') {
      return 'RC';
    }

    if (role === 'construction_company') {
      return 'CC';
    }

    return 'MG';
  });

  protected readonly breadcrumbLabelKey = computed(() => {
    const url = this.#currentUrl();

    if (url.startsWith('/subscriptions')) {
      return 'navigation.plan-subscription';
    }

    if (url.startsWith('/rentals/my-requests')) {
      return 'navigation.my-requests';
    }

    if (url.startsWith('/rentals/requests')) {
      return 'navigation.rental-requests';
    }

    if (url.startsWith('/rentals')) {
      return 'navigation.rentals';
    }

    if (url.startsWith('/inventory/search')) {
      return 'navigation.search-equipment';
    }

    if (url.startsWith('/inventory')) {
      return 'navigation.equipment';
    }

    if (url.startsWith('/profiles')) {
      return 'navigation.profile';
    }

    return 'navigation.dashboard';
  });

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
