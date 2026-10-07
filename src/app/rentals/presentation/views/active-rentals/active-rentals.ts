import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { RentalsStore } from '../../../application/rentals.store';

import { Rental } from '../../../domain/model/rental.entity';

import { RentalStatus } from '../../../domain/model/rental-status.enum';

@Component({
  selector: 'app-active-rentals',

  imports: [MatProgressSpinnerModule, MatTableModule, TranslatePipe],

  templateUrl: './active-rentals.html',

  styleUrl: './active-rentals.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveRentals {
  readonly store = inject(RentalsStore);

  readonly #iamStore = inject(IamStore);

  protected readonly displayedColumns = ['equipment', 'customer', 'period', 'status'];

  protected readonly dataSource = computed(
    () => new MatTableDataSource<Rental>(this.store.rentals()),
  );

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      if (userId === null) {
        this.store.clearRentals();

        return;
      }

      this.store.loadActiveRentalsForCompany(userId);
    });
  }

  protected equipmentName(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.name ?? `#${equipmentId}`;
  }

  protected equipmentCode(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.code ?? '-';
  }

  protected customerName(userId: number): string {
    const participant = this.store.getParticipantInformation(userId);

    if (!participant) {
      return `#${userId}`;
    }

    return participant.companyName;
  }

  protected customerContact(userId: number): string {
    const participant = this.store.getParticipantInformation(userId);

    if (!participant) {
      return '-';
    }

    return [participant.firstName, participant.lastName].filter(Boolean).join(' ');
  }

  protected statusKey(status: RentalStatus): string {
    return 'rentals.active.status.' + status.toLowerCase();
  }

  protected statusClass(status: RentalStatus): string {
    return status.toLowerCase();
  }

  protected formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
