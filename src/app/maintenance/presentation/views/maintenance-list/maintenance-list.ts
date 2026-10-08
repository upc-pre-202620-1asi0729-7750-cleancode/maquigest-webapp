
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

import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { MaintenanceStore } from '../../../application/maintenance.store';

import { Maintenance } from '../../../domain/model/maintenance.entity';

import { MaintenanceStatus } from '../../../domain/model/maintenance-status.enum';

import {
  MaintenanceForm,
  MaintenanceFormMode,
  MaintenanceFormValue,
} from '../../components/maintenance-form/maintenance-form';

type MaintenanceRecordFilter = 'all' | 'scheduled';

@Component({
  selector: 'app-maintenance-list',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
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

  protected readonly formMode = signal<MaintenanceFormMode>('register');

  protected readonly recordFilter = signal<MaintenanceRecordFilter>('all');

  protected readonly successMessageKey = signal('maintenance.list.success');

  protected readonly filteredMaintenances = computed(() => {
    const maintenances = this.store.maintenances();

    if (this.recordFilter() === 'scheduled') {
      return maintenances.filter(
        (maintenance) => maintenance.status === MaintenanceStatus.SCHEDULED,
      );
    }

    return maintenances;
  });

  protected readonly dataSource = computed(
    () => new MatTableDataSource<Maintenance>(this.filteredMaintenances()),
  );

  protected readonly scheduledCount = computed(
    () =>
      this.store
        .maintenances()
        .filter((maintenance) => maintenance.status === MaintenanceStatus.SCHEDULED).length,
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

  protected changeRecordFilter(filter: MaintenanceRecordFilter): void {
    this.recordFilter.set(filter);
  }

  protected openForm(mode: MaintenanceFormMode): void {
    if (
      this.store.loading() ||
      this.store.saving() ||
      this.store.equipmentInformation().length === 0
    ) {
      return;
    }

    this.store.clearSaveState();

    this.formMode.set(mode);

    this.formOpen.set(true);
  }

  protected closeForm(): void {
    if (!this.store.saving()) {
      this.formOpen.set(false);

      this.store.clearSaveState();
    }
  }

  protected submitForm(value: MaintenanceFormValue): void {
    const userId = this.#iamStore.currentUserId();

    if (userId === null || this.store.saving()) {
      return;
    }

    if (this.formMode() === 'schedule') {
      this.successMessageKey.set('maintenance.schedule.list.success');

      this.store.scheduleMaintenance(userId, value.equipmentId, value.performedAt, value.type);

      return;
    }

    this.successMessageKey.set('maintenance.list.success');

    this.store.registerMaintenance(userId, value.equipmentId, value.performedAt, value.type);
  }
}
