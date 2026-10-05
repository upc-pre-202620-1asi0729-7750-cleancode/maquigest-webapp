import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatError } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

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
    this.store.loadEquipment();
  }

  applyFilters(filters: EquipmentFilterCriteria): void {
    this.#filters.set(filters);
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
