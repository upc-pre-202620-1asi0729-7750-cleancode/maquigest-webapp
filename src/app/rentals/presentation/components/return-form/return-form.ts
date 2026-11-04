import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatCheckboxModule } from '@angular/material/checkbox';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';

import { Rental } from '../../../domain/model/rental.entity';

import { RentalLifecycleDatePolicy } from '../../../domain/policy/rental-lifecycle-date.policy';

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
  readonly #translate = inject(TranslateService);
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

  protected earliestDate(): string {
    return RentalLifecycleDatePolicy.limaDay(this.rental().period.startDate);
  }

  protected todayDate(): string {
    return RentalLifecycleDatePolicy.limaDay(new Date());
  }

  protected dateIssue() {
    return RentalLifecycleDatePolicy.returnDayIssue(
      this.form.controls.returnedAt.value, this.rental(),
    );
  }

  protected dateIssueMessage(): string {
    const issue = this.dateIssue();
    return issue === null ? '' : RentalLifecycleDatePolicy.describe(
      issue, this.#translate.currentLang() || 'es', this.earliestDate(),
    );
  }

  protected canSubmit(): boolean {
    return this.form.valid && this.dateIssue() === null;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (!this.canSubmit()) return;

    const returnedAt = RentalLifecycleDatePolicy.selectedDayToInstant(
      this.form.controls.returnedAt.value,
    );
    if (RentalLifecycleDatePolicy.returnInstantIssue(returnedAt, this.rental()) !== null) return;

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
    return RentalLifecycleDatePolicy.limaDay(new Date());
  }
}
