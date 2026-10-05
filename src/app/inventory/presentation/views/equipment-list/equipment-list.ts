import { Component, computed, effect, inject, viewChild } from '@angular/core';

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
    'status',
    'actions',
  ];

  readonly sort = viewChild(MatSort);
  readonly paginator = viewChild(MatPaginator);

  readonly dataSource = computed(() => {
    const source = new MatTableDataSource(this.store.equipment());

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

  editEquipment(id: number): void {
    this.#router.navigate(['/inventory/equipment', id, 'edit']).then();
  }

  navigateToNew(): void {
    this.#router.navigate(['/inventory/equipment/new']).then();
  }
}
