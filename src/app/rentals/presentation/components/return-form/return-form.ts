import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatCheckboxModule } from '@angular/material/checkbox';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '@ngx-translate/core';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';

import { Rental } from '../../../domain/model/rental.entity';

export interface ReturnFormValue {
  returnedAt: Date;
  notes: string;
  maintenanceRequired: boolean;
}

@Component({
  selector: 'app-return-form',

  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
  ],

  templateUrl: './return-form.html',

  styleUrl: './return-form.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnForm extends BaseForm {
  readonly rental = input.required<Rental>();

  readonly equipmentName = input.required<string>();

  readonly customerName = input.required<string>();

  readonly submitted = output<ReturnFormValue>();

  readonly cancelled = output<void>();

  protected readonly form = new FormGroup({
    returnedAt: new FormControl(this.#today(), {
      nonNullable: true,

      validators: [Validators.required],
    }),

    notes: new FormControl('', {
      nonNullable: true,
    }),

    maintenanceRequired: new FormControl(false, {
      nonNullable: true,
    }),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const returnedAt = new Date(`${this.form.controls.returnedAt.value}T12:00:00`);

    if (Number.isNaN(returnedAt.getTime())) {
      return;
    }

    this.submitted.emit({
      returnedAt,

      notes: this.form.controls.notes.value,

      maintenanceRequired: this.form.controls.maintenanceRequired.value,
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
