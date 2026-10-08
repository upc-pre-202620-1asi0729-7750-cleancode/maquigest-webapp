import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { MaintenanceStore } from '../../../application/maintenance.store';

import { Maintenance } from '../../../domain/model/maintenance.entity';

import { MaintenanceStatus } from '../../../domain/model/maintenance-status.enum';

import {
  MaintenanceForm,
  MaintenanceFormValue,
} from '../../components/maintenance-form/maintenance-form';

@Component({
  selector: 'app-maintenance-list',

  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    TranslatePipe,
    MaintenanceForm,
  ],

  templateUrl: './maintenance-list.html',

  styleUrl: './maintenance-list.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceList {
  readonly store = inject(MaintenanceStore);

  readonly #iamStore = inject(IamStore);

  protected readonly maintenanceStatus = MaintenanceStatus;

  protected readonly displayedColumns = ['equipment', 'date', 'type', 'status'];

  protected readonly formOpen = signal(false);

  protected readonly dataSource = computed(
    () => new MatTableDataSource<Maintenance>(this.store.maintenances()),
  );

  protected readonly completedCount = computed(
    () =>
      this.store
        .maintenances()
        .filter((maintenance) => maintenance.status === MaintenanceStatus.COMPLETED).length,
  );

  protected readonly equipmentWithRecordsCount = computed(
    () => new Set(this.store.maintenances().map((maintenance) => maintenance.equipmentId)).size,
  );

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      if (userId === null) {
        this.store.clear();

        return;
      }

      this.store.loadForCompany(userId);
    });

    effect(() => {
      if (this.store.saveSucceeded()) {
        this.formOpen.set(false);
      }
    });
  }

  protected equipmentName(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.name ?? `#${equipmentId}`;
  }

  protected equipmentCode(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.code ?? '-';
  }

  protected statusKey(status: MaintenanceStatus): string {
    return `maintenance.status.${status.toLowerCase()}`;
  }

  protected openForm(): void {
    if (
      this.store.loading() ||
      this.store.saving() ||
      this.store.equipmentInformation().length === 0
    ) {
      return;
    }

    this.store.clearSaveState();

    this.formOpen.set(true);
  }

  protected closeForm(): void {
    if (!this.store.saving()) {
      this.formOpen.set(false);
    }
  }

  protected submitForm(value: MaintenanceFormValue): void {
    const userId = this.#iamStore.currentUserId();

    if (userId === null) {
      return;
    }

    this.store.registerMaintenance(userId, value.equipmentId, value.performedAt, value.type);
  }
}
