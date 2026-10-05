import { DecimalPipe } from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import {
  MatError,
  MatFormFieldModule,
} from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { RentalsStore } from '../../../../rentals/application/rentals.store';

import { RentalRequest } from '../../../../rentals/domain/model/rental-request.entity';

import { DateRange } from '../../../../shared/domain/value-object/date-range.value-object';

import { InventoryStore } from '../../../application/inventory.store';

import { AvailabilityBadge } from '../../components/availability-badge/availability-badge';

@Component({
  selector: 'app-equipment-detail',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatError,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinner,
    TranslatePipe,
    AvailabilityBadge,
  ],
  templateUrl: './equipment-detail.html',
  styleUrl: './equipment-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentDetail {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #iamStore = inject(IamStore);

  readonly store = inject(InventoryStore);

  readonly rentalsStore =
    inject(RentalsStore);

  readonly equipmentId = Number(
    this.#route.snapshot.paramMap.get('id'),
  );

  readonly equipment = computed(() =>
    this.store
      .equipment()
      .find(
        (equipment) =>
          equipment.id === this.equipmentId,
      ),
  );

  readonly availabilityForm =
    new FormGroup({
      startDate: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
        ],
      }),

      endDate: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
        ],
      }),
    });

  readonly availabilityResult =
    signal<boolean | null>(null);

  readonly invalidPeriod =
    signal<boolean>(false);

  readonly selectedPeriod =
    signal<DateRange | null>(null);

  constructor() {
    this.rentalsStore.clearCreationState();

    if (
      Number.isInteger(this.equipmentId) &&
      this.equipmentId > 0
    ) {
      this.store.loadEquipmentById(
        this.equipmentId,
      );
    }
  }

  checkAvailability(): void {
    this.rentalsStore.clearCreationState();

    if (this.availabilityForm.invalid) {
      this.availabilityForm.markAllAsTouched();
      return;
    }

    const equipment = this.equipment();

    if (!equipment) {
      return;
    }

    const {
      startDate,
      endDate,
    } = this.availabilityForm.getRawValue();

    try {
      const period = new DateRange({
        startDate: new Date(
          `${startDate}T00:00:00`,
        ),

        endDate: new Date(
          `${endDate}T23:59:59.999`,
        ),
      });

      this.invalidPeriod.set(false);

      const isAvailable =
        equipment.isAvailableFor(period);

      this.availabilityResult.set(
        isAvailable,
      );

      this.selectedPeriod.set(
        isAvailable
          ? period
          : null,
      );
    } catch {
      this.invalidPeriod.set(true);

      this.availabilityResult.set(null);

      this.selectedPeriod.set(null);
    }
  }

  requestRental(): void {
    const equipment = this.equipment();

    const period =
      this.selectedPeriod();

    const constructionUserId =
      this.#iamStore.currentUserId();

    if (
      !equipment ||
      !period ||
      constructionUserId === null ||
      this.availabilityResult() !== true
    ) {
      return;
    }

    const rentalRequest =
      new RentalRequest({
        id: 0,

        equipmentId:
        equipment.id,

        constructionUserId,

        rentalCompanyUserId:
        equipment.userId,

        period,
      });

    this.rentalsStore
      .createRentalRequest(
        rentalRequest,
      );
  }

  resetAvailabilityResult(): void {
    this.invalidPeriod.set(false);

    this.availabilityResult.set(null);

    this.selectedPeriod.set(null);

    this.rentalsStore
      .clearCreationState();
  }

  backToSearch(): void {
    this.#router
      .navigate([
        '/inventory/search',
      ])
      .then();
  }
}
