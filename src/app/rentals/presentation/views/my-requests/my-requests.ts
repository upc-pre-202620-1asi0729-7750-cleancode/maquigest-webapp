import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';

import { RouterLink } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { RentalsStore } from '../../../application/rentals.store';

import { RentalRequest } from '../../../domain/model/rental-request.entity';

import { RentalRequestStatus } from '../../../domain/model/rental-request-status.enum';

@Component({
  selector: 'app-my-requests',

  imports: [RouterLink, MatProgressSpinnerModule, MatTableModule, TranslatePipe],

  templateUrl: './my-requests.html',

  styleUrl: './my-requests.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRequests {
  readonly store = inject(RentalsStore);

  readonly #iamStore = inject(IamStore);

  protected readonly displayedColumns = ['equipment', 'period', 'requestedAt', 'status', 'actions'];

  protected readonly dataSource = computed(
    () => new MatTableDataSource<RentalRequest>(this.store.rentalRequests()),
  );

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      if (userId === null) {
        this.store.clearRentalRequests();

        return;
      }

      this.store.loadRentalRequestsForConstructionCompany(userId);
    });
  }

  protected equipmentName(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.name ?? `#${equipmentId}`;
  }

  protected equipmentCode(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.code ?? '-';
  }

  protected statusKey(status: RentalRequestStatus): string {
    return 'rentals.my-requests.status.' + status.toLowerCase();
  }

  protected statusClass(status: RentalRequestStatus): string {
    return status.toLowerCase();
  }

  protected formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
