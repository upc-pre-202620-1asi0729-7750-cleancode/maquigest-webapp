
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
import { MatDialog } from '@angular/material/dialog';

import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { MaintenanceStore } from '../../../application/maintenance.store';

import { Maintenance } from '../../../domain/model/maintenance.entity';

import { MaintenanceStatus } from '../../../domain/model/maintenance-status.enum';
import {
  MaintenanceCompletionDialog,
  MaintenanceCompletionResult,
} from '../../components/maintenance-completion-dialog/maintenance-completion-dialog';

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

  readonly #dialog = inject(MatDialog);

  protected readonly maintenanceStatus = MaintenanceStatus;

  protected readonly displayedColumns = ['equipment', 'date', 'type', 'status', 'actions'];

  protected readonly formOpen = signal(false);

  protected readonly formMode = signal<MaintenanceFormMode>('register');

  protected readonly recordFilter = signal<MaintenanceRecordFilter>('all');
  protected readonly searchPanelOpen = signal(false);

  // F6.2: presentation-only filters over the records already loaded by MaintenanceStore.
  protected readonly searchQuery = signal('');
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly hasActiveSearch = computed(() =>
    !!this.searchQuery().trim() || !!this.startDate() || !!this.endDate(),
  );
  protected readonly invalidDateRange = computed(() =>
    !!this.startDate() && !!this.endDate() && this.startDate() > this.endDate(),
  );


  protected readonly successMessageKey = signal('maintenance.list.success');

  protected readonly filteredMaintenances = computed(() => {
    const query = this.#normalizeSearch(this.searchQuery());
    const from = this.startDate();
    const to = this.endDate();

    if (from && to && from > to) return [];

    return this.store.maintenances().filter((maintenance) => {
      if (
        this.recordFilter() === 'scheduled' &&
        maintenance.status !== MaintenanceStatus.SCHEDULED
      ) return false;

      const equipment = this.store.getEquipmentInformation(maintenance.equipmentId);
      const haystack = this.#normalizeSearch(
        `${equipment?.name ?? ''} ${equipment?.code ?? ''}`,
      );
      if (query && !haystack.includes(query)) return false;

      const day = this.#dateKey(maintenance.performedAt);
      return (!from || day >= from) && (!to || day <= to);
    });
  });

  protected readonly filteredCount = computed(() => this.filteredMaintenances().length);

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

  protected toggleSearchPanel(): void {
    this.searchPanelOpen.update((open) => !open);
  }

  protected changeRecordFilter(filter: MaintenanceRecordFilter): void {
    this.recordFilter.set(filter);
  }

  protected clearHistoryFilters(): void {
    this.searchQuery.set('');
    this.startDate.set('');
    this.endDate.set('');
  }

  #normalizeSearch(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  #dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  protected isPendingMaintenance(record: Maintenance): boolean {
    return (
      record.status === MaintenanceStatus.SCHEDULED ||
      record.status === MaintenanceStatus.IN_PROGRESS
    );
  }

  protected canCompleteMaintenance(record: Maintenance): boolean {
    if (!this.isPendingMaintenance(record)) return false;
    if (record.status === MaintenanceStatus.IN_PROGRESS) return true;
    // Mirrors the server's calendar-day rule in America/Lima; the aggregate remains authoritative.
    return this.#limaCalendarDay(new Date()) >= this.#limaCalendarDay(record.performedAt);
  }

  #limaCalendarDay(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const part = (name: string): string => parts.find((item) => item.type === name)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  protected openCompletion(record: Maintenance): void {
    if (this.store.loading() || this.store.saving() || !this.canCompleteMaintenance(record)) return;

    const userId = this.#iamStore.currentUserId();
    if (userId === null) return;

    this.store.clearSaveState();
    this.#dialog.open<MaintenanceCompletionDialog, { equipmentName: string; type: string }, MaintenanceCompletionResult>(
      MaintenanceCompletionDialog,
      {
        width: '520px',
        maxWidth: '95vw',
        data: { equipmentName: this.equipmentName(record.equipmentId), type: record.type },
      },
    ).afterClosed().subscribe((result) => {
      if (!result || this.store.saving()) return;
      this.successMessageKey.set('maintenance.advance.success');
      this.store.completeMaintenance(userId, record, result.technician, result.notes);
    });
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
