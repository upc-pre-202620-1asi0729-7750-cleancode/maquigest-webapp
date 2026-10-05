import { Component, effect, inject } from '@angular/core';

import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInput } from '@angular/material/input';

import { MatSelectModule } from '@angular/material/select';

import { TranslatePipe } from '@ngx-translate/core';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';

import { IamStore } from '../../../../iam/application/iam.store';

import { InventoryStore } from '../../../application/inventory.store';

import { Equipment } from '../../../domain/model/equipment.entity';

import { RentalRate } from '../../../domain/value-object/rental-rate.value-object';

@Component({
  selector: 'app-equipment-form',

  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInput,
    TranslatePipe,
  ],

  templateUrl: './equipment-form.html',

  styleUrl: './equipment-form.css',
})
export class EquipmentForm extends BaseForm {
  readonly #fb = inject(FormBuilder);

  readonly #route = inject(ActivatedRoute);

  readonly #router = inject(Router);

  readonly #inventoryStore = inject(InventoryStore);

  readonly #iamStore = inject(IamStore);

  readonly categories = this.#inventoryStore.categories;

  readonly loading = this.#inventoryStore.loading;

  readonly error = this.#inventoryStore.error;

  isEdit = false;

  equipmentId: number | null = null;

  form = this.#fb.group({
    code: new FormControl<string>('', {
      nonNullable: true,

      validators: [Validators.required],
    }),

    name: new FormControl<string>('', {
      nonNullable: true,

      validators: [Validators.required],
    }),

    description: new FormControl<string>('', {
      nonNullable: true,

      validators: [Validators.required],
    }),

    categoryId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),

    location: new FormControl<string>('', {
      nonNullable: true,

      validators: [Validators.required],
    }),

    dailyRate: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),

    weeklyRate: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
  });

  constructor() {
    super();

    this.#inventoryStore.clearSaveState();

    effect(() => {
      if (this.#inventoryStore.saveSucceeded()) {
        this.#router.navigate(['/inventory/equipment']).then();

        return;
      }

      if (this.#inventoryStore.accessDenied()) {
        this.#router.navigate(['/subscriptions/plans']).then();
      }
    });

    this.#route.params.subscribe((params) => {
      this.equipmentId = params['id'] ? +params['id'] : null;

      this.isEdit = !!this.equipmentId;

      if (this.isEdit && this.equipmentId) {
        const equipment = this.#inventoryStore.getEquipmentById(this.equipmentId)();

        if (equipment) {
          this.form.patchValue({
            code: equipment.code,

            name: equipment.name,

            description: equipment.description,

            categoryId: equipment.categoryId,

            location: equipment.location,

            dailyRate: equipment.rentalRate.dailyRate,

            weeklyRate: equipment.rentalRate.weeklyRate,
          });
        }
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const currentUserId = this.#iamStore.currentUserId();

    if (currentUserId === null) {
      return;
    }

    const currentEquipment = this.equipmentId
      ? this.#inventoryStore.getEquipmentById(this.equipmentId)()
      : undefined;

    const equipment = new Equipment({
      id: this.equipmentId ?? 0,

      userId: currentEquipment?.userId ?? currentUserId,

      code: this.form.controls.code.value,

      name: this.form.controls.name.value,

      description: this.form.controls.description.value,

      categoryId: this.form.controls.categoryId.value ?? 0,

      location: this.form.controls.location.value,

      rentalRate: new RentalRate({
        dailyRate: this.form.controls.dailyRate.value ?? 0,

        weeklyRate: this.form.controls.weeklyRate.value ?? 0,
      }),

      status: currentEquipment?.status,

      availabilityBlocks: currentEquipment?.availabilityBlocks ?? [],
    });

    if (this.isEdit) {
      this.#inventoryStore.updateEquipment(equipment);
    } else {
      this.#inventoryStore.addEquipment(equipment);
    }
  }
}
