import { DecimalPipe } from '@angular/common';

import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatError, MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { DateRange } from '../../../../shared/domain/value-object/date-range.value-object';

import { InventoryStore } from '../../../application/inventory.store';
import { EQUIPMENT_RENTAL_REQUEST_PORT } from '../../../infrastructure/equipment-rental-request.port';

import { AvailabilityBadge } from '../../components/availability-badge/availability-badge';

// Presentation-only mapping: domain/ACL errors remain language-independent.
const RENTAL_REQUEST_ERROR_KEYS: Readonly<Record<string, string>> = {
  'Equipment is not available: its operational status has changed': 'equipment.detail.request-errors.status-changed',
  'Equipment has an open blocking maintenance incident': 'equipment.detail.request-errors.blocking-incident',
  'Equipment is already reserved for the selected period': 'equipment.detail.request-errors.reserved',
  'Equipment already has a confirmed or active rental for the selected period': 'equipment.detail.request-errors.rental-overlap',
  'Equipment does not belong to the requested rental company': 'equipment.detail.request-errors.company-mismatch',
  'Equipment not found': 'equipment.detail.request-errors.not-found',
  'Only construction companies can request equipment rental': 'equipment.detail.request-errors.requester-role',
  'Unable to verify equipment reservations': 'equipment.detail.request-errors.reservations-check-failed',
  'Unable to verify maintenance incidents': 'equipment.detail.request-errors.incidents-check-failed',
  'Invalid equipment, company or rental period': 'equipment.detail.request-errors.invalid-request',
  'Invalid equipment identifier': 'equipment.detail.request-errors.invalid-request',
};

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
  readonly #destroyRef = inject(DestroyRef);

  readonly store = inject(InventoryStore);

  readonly rentalsStore = inject(EQUIPMENT_RENTAL_REQUEST_PORT);

  readonly rentalRequestErrorTranslationKey = computed(() => {
    const error = this.rentalsStore.error();
    if (!error) {
      return 'equipment.detail.request-errors.generic';
    }

    const mapped = RENTAL_REQUEST_ERROR_KEYS[error];
    if (mapped) {
      return mapped;
    }

    if (error.startsWith('Failed to check current equipment availability')) {
      return 'equipment.detail.request-errors.availability-check-failed';
    }

    if (error.startsWith('Failed to check maintenance incident restrictions')) {
      return 'equipment.detail.request-errors.incidents-check-failed';
    }

    return 'equipment.detail.request-errors.generic';
  });

  readonly equipmentId = signal<number>(0);
  readonly checkingAvailability = signal(false);
  readonly availabilityCheckFailed = signal(false);
  #availabilityRequestVersion = 0;

  readonly equipment = computed(() =>
    this.store.equipment().find((equipment) => equipment.id === this.equipmentId()),
  );

  readonly availabilityForm = new FormGroup({
    startDate: new FormControl('', {
      nonNullable: true,

      validators: [Validators.required],
    }),

    endDate: new FormControl('', {
      nonNullable: true,

      validators: [Validators.required],
    }),
  });

  readonly availabilityResult = signal<boolean | null>(null);

  readonly invalidPeriod = signal<boolean>(false);

  readonly selectedPeriod = signal<DateRange | null>(null);

  constructor() {
    this.#route.paramMap.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      this.equipmentId.set(id);
      this.resetAvailabilityResult();
      if (Number.isInteger(id) && id > 0) this.store.loadEquipmentById(id);
    });

    // A response rejected by Rentals invalidates the prior availability result.
    effect(() => {
      if (this.rentalsStore.error()) {
        this.#invalidateAvailability();
        const id = this.equipmentId();
        if (Number.isInteger(id) && id > 0) this.store.loadEquipmentById(id);
      }
    });

    // External mutations (other tab / JSON Server) are detected when returning to this tab.
    if (typeof window !== 'undefined') {
      fromEvent(window, 'focus').pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => {
        const id = this.equipmentId();
        this.#invalidateAvailability();
        if (!Number.isInteger(id) || id <= 0) return;
        // Previously entered dates are revalidated against current server data.
        if (this.availabilityForm.valid) {
          this.checkAvailability();
        } else {
          this.store.loadEquipmentById(id);
        }
      });
    }
  }

  checkAvailability(): void {
    this.rentalsStore.clearCreationState();
    this.#invalidateAvailability();
    if (this.availabilityForm.invalid) {
      this.availabilityForm.markAllAsTouched();
      return;
    }

    const id = this.equipmentId();
    if (!Number.isInteger(id) || id <= 0) return;
    const { startDate, endDate } = this.availabilityForm.getRawValue();
    let period: DateRange;
    try {
      period = new DateRange({
        startDate: new Date(`${startDate}T00:00:00`),
        endDate: new Date(`${endDate}T23:59:59.999`),
      });
      this.invalidPeriod.set(false);
    } catch {
      this.invalidPeriod.set(true);
      return;
    }

    const version = ++this.#availabilityRequestVersion;
    this.checkingAvailability.set(true);
    this.store.verifyEquipmentAvailability(id, period)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (available) => {
          if (version !== this.#availabilityRequestVersion || id !== this.equipmentId()) return;
          this.checkingAvailability.set(false);
          this.availabilityResult.set(available);
          this.selectedPeriod.set(available ? period : null);
        },
        error: () => {
          if (version !== this.#availabilityRequestVersion) return;
          this.checkingAvailability.set(false);
          this.availabilityCheckFailed.set(true);
          this.selectedPeriod.set(null);
        },
      });
  }

  #invalidateAvailability(): void {
    ++this.#availabilityRequestVersion;
    this.checkingAvailability.set(false);
    this.availabilityCheckFailed.set(false);
    this.invalidPeriod.set(false);
    this.availabilityResult.set(null);
    this.selectedPeriod.set(null);
  }

  requestRental(): void {
    const equipment = this.equipment();

    const period = this.selectedPeriod();

    const constructionUserId = this.#iamStore.currentUserId();

    if (
      !equipment ||
      !period ||
      constructionUserId === null ||
      this.availabilityResult() !== true ||
      this.#iamStore.currentRole() !== 'construction_company'
    ) {
      return;
    }

    this.rentalsStore.submitRentalRequest(
      equipment.id,
      constructionUserId,
      equipment.userId,
      period,
    );
  }

  resetAvailabilityResult(): void {
    this.#invalidateAvailability();
    this.rentalsStore.clearCreationState();
  }

  backToSearch(): void {
    this.#router.navigate(['/inventory/search']).then();
  }
}
