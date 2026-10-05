import { DecimalPipe } from '@angular/common';

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { InventoryStore } from '../../../application/inventory.store';

import { DateRange } from '../../../../shared/domain/value-object/date-range.value-object';

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

  readonly store = inject(InventoryStore);

  readonly equipmentId = Number(this.#route.snapshot.paramMap.get('id'));

  readonly equipment = computed(() =>
    this.store.equipment().find((equipment) => equipment.id === this.equipmentId),
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

  constructor() {
    if (Number.isInteger(this.equipmentId) && this.equipmentId > 0) {
      this.store.loadEquipmentById(this.equipmentId);
    }
  }

  checkAvailability(): void {
    if (this.availabilityForm.invalid) {
      this.availabilityForm.markAllAsTouched();
      return;
    }

    const equipment = this.equipment();

    if (!equipment) {
      return;
    }

    const { startDate, endDate } = this.availabilityForm.getRawValue();

    try {
      const period = new DateRange({
        startDate: new Date(`${startDate}T00:00:00`),
        endDate: new Date(`${endDate}T23:59:59.999`),
      });

      this.invalidPeriod.set(false);

      this.availabilityResult.set(equipment.isAvailableFor(period));
    } catch {
      this.invalidPeriod.set(true);
      this.availabilityResult.set(null);
    }
  }

  resetAvailabilityResult(): void {
    this.invalidPeriod.set(false);
    this.availabilityResult.set(null);
  }

  backToSearch(): void {
    this.#router.navigate(['/inventory/search']).then();
  }
}
