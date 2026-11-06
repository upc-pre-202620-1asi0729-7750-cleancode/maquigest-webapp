import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';

import { Router } from '@angular/router';

import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';
import { MatSort, MatSortHeader } from '@angular/material/sort';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { InventoryStore } from '../../../application/inventory.store';

import { AvailabilityBadge } from '../../components/availability-badge/availability-badge';

@Component({
  selector: 'app-equipment-list',
  imports: [
    MatButton,
    MatIconButton,
    MatIcon,
    MatError,
    MatPaginator,
    MatProgressSpinner,
    MatTable,
    MatHeaderCellDef,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderRow,
    MatRow,
    MatSort,
    MatSortHeader,
    TranslatePipe,
    AvailabilityBadge,
  ],
  templateUrl: './equipment-list.html',
  styleUrl: './equipment-list.css',
})
export class EquipmentList {
  readonly #iamStore = inject(IamStore);
  readonly store = inject(InventoryStore);
  readonly #router = inject(Router);

  readonly displayedColumns: string[] = [
    'code',
    'name',
    'category',
    'location',
    'availability',
    'status',
    'actions',
  ];

  // Presentation-only selectors. No API/store mutations or new backend requests.
  readonly searchTerm = signal('');
  readonly statusFilter = signal('ALL');
  readonly categoryFilter = signal('ALL');

  readonly availableCount = computed(() =>
    this.store.equipment().filter((equipment) => equipment.status === 'AVAILABLE').length,
  );
  readonly unavailableCount = computed(() => this.store.equipment().length - this.availableCount());
  readonly filteredEquipment = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    const status = this.statusFilter();
    const category = this.categoryFilter();
    return this.store.equipment().filter((equipment) => {
      if (status !== 'ALL' && equipment.status !== status) return false;
      if (category !== 'ALL' && equipment.categoryId !== Number(category)) return false;
      if (!term) return true;
      return [equipment.code, equipment.name, equipment.location, equipment.category?.name ?? '']
        .some((value) => value.toLocaleLowerCase().includes(term));
    });
  });

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }
  updateStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }
  updateCategoryFilter(event: Event): void {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
  }
  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('ALL');
    this.categoryFilter.set('ALL');
  }

  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  readonly dataSource = computed(() => {
    const source = new MatTableDataSource(this.filteredEquipment());

    const sort = this.sort();

    if (sort) {
      source.sort = sort;
    }

    const paginator = this.paginator();

    if (paginator) {
      source.paginator = paginator;
    }

    return source;
  });

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      if (userId === null) {
        this.store.clearEquipment();
        return;
      }

      this.store.loadEquipmentByUserId(userId);
    });
  }

  openHistory(id: number): void {
    this.#router.navigate(['/maintenance/equipment', id, 'history']).then();
  }

  editEquipment(id: number): void {
    this.#router.navigate(['/inventory/equipment', id, 'edit']).then();
  }

  navigateToNew(): void {
    this.#router.navigate(['/inventory/equipment/new']).then();
  }
}
