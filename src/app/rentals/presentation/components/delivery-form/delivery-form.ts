import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '@ngx-translate/core';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';

import { Rental } from '../../../domain/model/rental.entity';

export interface DeliveryFormValue {
  deliveredAt: Date;
  notes: string;
}

@Component({
  selector: 'app-delivery-form',

  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
  ],

  templateUrl: './delivery-form.html',

  styleUrl: './delivery-form.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryForm extends BaseForm {
  readonly rental = input.required<Rental>();

  readonly equipmentName = input.required<string>();

  readonly customerName = input.required<string>();

  readonly submitted = output<DeliveryFormValue>();

  readonly cancelled = output<void>();

  protected readonly form = new FormGroup({
    deliveredAt: new FormControl(this.#today(), {
      nonNullable: true,

      validators: [Validators.required],
    }),

    notes: new FormControl('', {
      nonNullable: true,
    }),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const deliveredAt = new Date(`${this.form.controls.deliveredAt.value}T12:00:00`);

    if (Number.isNaN(deliveredAt.getTime())) {
      return;
    }

    this.submitted.emit({
      deliveredAt,

      notes: this.form.controls.notes.value,
    });
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  #today(): string {
    const now = new Date();

    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

    return localDate.toISOString().slice(0, 10);
  }
}
