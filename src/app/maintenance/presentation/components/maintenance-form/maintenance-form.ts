
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TranslatePipe } from '@ngx-translate/core';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';

import { MaintenanceEquipmentInformation } from '../../../infrastructure/equipment-information.port';

export type MaintenanceFormMode = 'register' | 'schedule';

export interface MaintenanceFormValue {
  equipmentId: number;
  performedAt: Date;
  type: string;
}

@Component({
  selector: 'app-maintenance-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './maintenance-form.html',
  styleUrl: './maintenance-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceForm extends BaseForm {
  readonly equipment = input.required<MaintenanceEquipmentInformation[]>();

  readonly mode = input<MaintenanceFormMode>('register');

  readonly saving = input(false);

  readonly error = input<string | null>(null);

  readonly submitted = output<MaintenanceFormValue>();

  readonly cancelled = output<void>();

  protected readonly today = this.#localDateString(new Date());

  protected readonly invalidDate = signal(false);

  protected readonly form = new FormGroup({
    equipmentId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),

    performedAt: new FormControl(this.today, {
      nonNullable: true,
      validators: [Validators.required],
    }),

    type: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    const equipmentId = this.form.controls.equipmentId.value;

    const dateString = this.form.controls.performedAt.value;

    const type = this.form.controls.type.value.trim();

    const maintenanceDate = new Date(`${dateString}T12:00:00`);

    const validCalendarDate =
      /^\d{4}-\d{2}-\d{2}$/.test(dateString) &&
      !Number.isNaN(maintenanceDate.getTime()) &&
      this.#localDateString(maintenanceDate) === dateString;

    const validDateForMode =
      this.mode() === 'schedule' ? dateString >= this.today : dateString <= this.today;

    const dateIsValid = validCalendarDate && validDateForMode;

    this.invalidDate.set(!dateIsValid);

    if (this.saving() || this.form.invalid || equipmentId === null || !type || !dateIsValid) {
      return;
    }

    const equipmentExists = this.equipment().some((item) => item.id === equipmentId);

    if (!equipmentExists) {
      return;
    }

    this.submitted.emit({
      equipmentId,
      performedAt: maintenanceDate,
      type,
    });
  }

  protected cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }

  #localDateString(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
