import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSelectModule } from '@angular/material/select';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { RentalsStore } from '../../../application/rentals.store';

import { RentalRequest } from '../../../domain/model/rental-request.entity';

import { RentalRequestStatus } from '../../../domain/model/rental-request-status.enum';

type RequestStatusFilter = 'ALL' | RentalRequestStatus;

@Component({
  selector: 'app-rental-requests',

  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    TranslatePipe,
  ],

  templateUrl: './rental-requests.html',

  styleUrl: './rental-requests.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalRequests {
  readonly store = inject(RentalsStore);

  readonly #iamStore = inject(IamStore);

  protected readonly displayedColumns = [
    'requester',
    'equipment',
    'period',
    'requestedAt',
    'status',
    'actions',
  ];

  protected readonly statusOptions = [
    RentalRequestStatus.PENDING,
    RentalRequestStatus.APPROVED,
    RentalRequestStatus.REJECTED,
  ];

  protected readonly statusFilter = signal<RequestStatusFilter>('ALL');

  protected readonly dateFilter = signal<string>('');

  protected readonly filteredRequests = computed(() => {
    const status = this.statusFilter();

    const date = this.dateFilter();

    return this.store.rentalRequests().filter((request) => {
      if (status !== 'ALL' && request.status !== status) {
        return false;
      }

      if (date && this.formatDate(request.createdAt) !== date) {
        return false;
      }

      return true;
    });
  });

  protected readonly dataSource = computed(
    () => new MatTableDataSource<RentalRequest>(this.filteredRequests()),
  );

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      if (userId === null) {
        this.store.clearRentalRequests();

        return;
      }

      this.store.loadRentalRequestsForCompany(userId);
    });
  }

  protected setStatusFilter(value: RequestStatusFilter): void {
    this.statusFilter.set(value);
  }

  protected setDateFilter(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.dateFilter.set(input.value);
  }

  protected clearFilters(): void {
    this.statusFilter.set('ALL');

    this.dateFilter.set('');
  }

  protected approveRequest(request: RentalRequest): void {
    if (!request.isPending || this.isUpdating(request.id)) {
      return;
    }

    this.store.approveRentalRequest(request.id);
  }

  protected rejectRequest(request: RentalRequest): void {
    if (!request.isPending || this.isUpdating(request.id)) {
      return;
    }

    this.store.rejectRentalRequest(request.id);
  }

  protected isUpdating(requestId: number): boolean {
    return this.store.updatingRequestId() === requestId;
  }

  protected equipmentName(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.name ?? `#${equipmentId}`;
  }

  protected equipmentCode(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.code ?? '-';
  }

  protected requesterName(userId: number): string {
    const participant = this.store.getParticipantInformation(userId);

    if (!participant) {
      return `#${userId}`;
    }

    return participant.companyName;
  }

  protected requesterContact(userId: number): string {
    const participant = this.store.getParticipantInformation(userId);

    if (!participant) {
      return '-';
    }

    return [participant.firstName, participant.lastName].filter(Boolean).join(' ');
  }

  protected statusKey(status: RentalRequestStatus): string {
    return 'rentals.requests.status.' + status.toLowerCase();
  }

  protected statusClass(status: RentalRequestStatus): string {
    return status.toLowerCase();
  }

  protected formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
