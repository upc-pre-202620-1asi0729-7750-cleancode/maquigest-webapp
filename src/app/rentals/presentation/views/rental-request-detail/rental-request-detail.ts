import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { RentalsStore } from '../../../application/rentals.store';

import { RentalRequestStatus } from '../../../domain/model/rental-request-status.enum';

@Component({
  selector: 'app-rental-request-detail',

  imports: [RouterLink, MatProgressSpinnerModule, TranslatePipe],

  templateUrl: './rental-request-detail.html',

  styleUrl: './rental-request-detail.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalRequestDetail {
  readonly store = inject(RentalsStore);

  readonly #iamStore = inject(IamStore);

  readonly #route = inject(ActivatedRoute);

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      const requestId = Number(this.#route.snapshot.paramMap.get('id'));

      if (userId === null || !Number.isInteger(requestId) || requestId <= 0) {
        this.store.clearRentalRequestDetail();

        return;
      }

      this.store.loadRentalRequestDetail(requestId, userId);
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
