import { DOCUMENT, isPlatformBrowser } from '@angular/common';

import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, computed, effect, inject, signal, untracked } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { auditTime, filter, fromEvent, interval, merge } from 'rxjs';

import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatError } from '@angular/material/form-field';

import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { InventoryStore } from '../../../application/inventory.store';

import { Equipment } from '../../../domain/model/equipment.entity';

import { EquipmentStatus } from '../../../domain/model/equipment-status.enum';

import {
  EquipmentFilter,
  EquipmentFilterCriteria,
} from '../../components/equipment-filter/equipment-filter';

import { AvailabilityBadge } from '../../components/availability-badge/availability-badge';

@Component({
  selector: 'app-equipment-search',

  imports: [
    MatButtonModule,
    MatCardModule,
    MatError,
    MatProgressSpinner,
    TranslatePipe,
    EquipmentFilter,
    AvailabilityBadge,
  ],

  templateUrl: './equipment-search.html',

  styleUrl: './equipment-search.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentSearch {
  readonly store = inject(InventoryStore);

  readonly #router = inject(Router);

  readonly #iamStore = inject(IamStore);
  readonly #destroyRef = inject(DestroyRef);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #document = inject(DOCUMENT);

  readonly #filters = signal<EquipmentFilterCriteria>({
    query: '',
    categoryId: null,
    location: '',
    availability: 'ALL',
  });

  readonly filteredEquipment = computed(() => {
    const filters = this.#filters();

    const now = new Date();

    return this.store
      .equipment()
      .filter((equipment) => this.#matchesQuery(equipment, filters.query))
      .filter((equipment) => this.#matchesCategory(equipment, filters.categoryId))
      .filter((equipment) => this.#matchesLocation(equipment, filters.location))
      .filter((equipment) => this.#matchesAvailability(equipment, filters.availability, now));
  });

  constructor() {
    // User/account changes invalidate the previous marketplace projection.
    // Reads are coordinated from the Inventory Application Store, never from Presentation.
    effect(() => {
      const userId = this.#iamStore.currentUserId();
      const role = this.#iamStore.currentRole();
      if (userId === null || role !== 'construction_company') return;
      untracked(() => this.store.loadMarketplaceEquipment());
    });

    if (!isPlatformBrowser(this.#platformId)) return;

    // Another tab or actor may edit equipment while this view remains mounted.
    // Refresh immediately on focus/visibility and at most every 15s while visible.
    merge(
      fromEvent(window, 'focus'),
      fromEvent(this.#document, 'visibilitychange').pipe(
        filter(() => !this.#document.hidden),
      ),
      interval(15_000).pipe(filter(() => !this.#document.hidden)),
    )
      .pipe(auditTime(250), takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => {
        if (
          this.#iamStore.currentUserId() !== null &&
          this.#iamStore.currentRole() === 'construction_company'
        ) {
          this.store.loadMarketplaceEquipment(true);
        }
      });
  }

  applyFilters(filters: EquipmentFilterCriteria): void {
    this.#filters.set(filters);
  }

  viewDetails(id: number): void {
    this.#router.navigate(['/inventory/equipment', id]).then();
  }

  #matchesQuery(equipment: Equipment, query: string): boolean {
    if (!query) {
      return true;
    }

    const normalizedQuery = query.toLowerCase();

    return [
      equipment.code,
      equipment.name,
      equipment.description,
      equipment.category?.name ?? '',
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  }

  #matchesCategory(equipment: Equipment, categoryId: number | null): boolean {
    if (categoryId === null) {
      return true;
    }

    return equipment.categoryId === categoryId;
  }

  #matchesLocation(equipment: Equipment, location: string): boolean {
    if (!location) {
      return true;
    }

    return equipment.location.toLowerCase().includes(location.toLowerCase());
  }

  #matchesAvailability(
    equipment: Equipment,
    availability: EquipmentFilterCriteria['availability'],
    now: Date,
  ): boolean {
    if (availability === 'ALL') {
      return true;
    }

    if (availability === 'MAINTENANCE') {
      return equipment.status === EquipmentStatus.MAINTENANCE;
    }

    if (availability === 'RENTED') {
      return equipment.status === EquipmentStatus.RENTED;
    }

    const isReserved =
      equipment.status === EquipmentStatus.AVAILABLE && equipment.isReservedOn(now);

    if (availability === 'RESERVED') {
      return isReserved;
    }

    return equipment.status === EquipmentStatus.AVAILABLE && !isReserved;
  }
}
