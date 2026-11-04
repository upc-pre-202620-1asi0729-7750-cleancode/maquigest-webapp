import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';

import { Rental } from '../../../domain/model/rental.entity';

import { RentalLifecycleDatePolicy } from '../../../domain/policy/rental-lifecycle-date.policy';

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
  readonly #translate = inject(TranslateService);
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

  protected earliestDate(): string {
    return RentalLifecycleDatePolicy.limaDay(this.rental().period.startDate);
  }

  protected latestDate(): string {
    return RentalLifecycleDatePolicy.limaDay(this.rental().period.endDate);
  }

  protected todayDate(): string {
    return RentalLifecycleDatePolicy.limaDay(new Date());
  }

  protected dateIssue() {
    return RentalLifecycleDatePolicy.deliveryDayIssue(
      this.form.controls.deliveredAt.value, this.rental(),
    );
  }

  protected dateIssueMessage(): string {
    const issue = this.dateIssue();
    return issue === null ? '' : RentalLifecycleDatePolicy.describe(
      issue, this.#translate.currentLang() || 'es', this.earliestDate(), this.latestDate(),
    );
  }

  protected canSubmit(): boolean {
    return this.form.valid && this.dateIssue() === null;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (!this.canSubmit()) return;

    const deliveredAt = RentalLifecycleDatePolicy.selectedDayToInstant(
      this.form.controls.deliveredAt.value,
    );
    if (RentalLifecycleDatePolicy.deliveryInstantIssue(deliveredAt, this.rental()) !== null) return;

    this.submitted.emit({ deliveredAt, notes: this.form.controls.notes.value });
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  #today(): string {
    return RentalLifecycleDatePolicy.limaDay(new Date());
  }
}
