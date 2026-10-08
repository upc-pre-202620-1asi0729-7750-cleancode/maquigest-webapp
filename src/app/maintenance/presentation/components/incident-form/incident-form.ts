import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TranslatePipe } from '@ngx-translate/core';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';

import {
  MaintenanceEquipmentInformation,
} from '../../../infrastructure/equipment-information.port';

export interface IncidentFormValue {
  equipmentId: number;
  description: string;
  blocksRental: boolean;
}

@Component({
  selector: 'app-incident-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './incident-form.html',
  styleUrl: './incident-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentForm extends BaseForm {
  readonly equipment =
    input.required<MaintenanceEquipmentInformation[]>();

  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly submitted = output<IncidentFormValue>();
  readonly cancelled = output<void>();

  protected readonly form = new FormGroup({
    equipmentId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),

    description: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(1000),
      ],
    }),

    blocksRental: new FormControl(false, {
      nonNullable: true,
    }),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.saving() || this.form.invalid) {
      return;
    }

    const equipmentId =
      this.form.controls.equipmentId.value;

    const description =
      this.form.controls.description.value.trim();

    if (equipmentId === null || !description) {
      return;
    }

    if (!this.equipment().some((item) => item.id === equipmentId)) {
      return;
    }

    this.submitted.emit({
      equipmentId,
      description,
      blocksRental: this.form.controls.blocksRental.value,
    });
  }

  protected cancel(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }
}
