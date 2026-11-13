import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { RentalLifecycleDatePolicy } from '../../../domain/policy/rental-lifecycle-date.policy';
import { RentalRequestReschedulingPolicy, type RentalReschedulingDateIssue } from '../../../domain/policy/rental-request-rescheduling.policy';
import { RentalRequest } from '../../../domain/model/rental-request.entity';
import { rentalRequestReschedulingCopy } from './rental-request-rescheduling.copy';

import { RentalsStore } from '../../../application/rentals.store';

import { RentalRequestStatus } from '../../../domain/model/rental-request-status.enum';

@Component({
  selector: 'app-rental-request-detail',

  imports: [RouterLink, ReactiveFormsModule, MatProgressSpinnerModule, TranslatePipe],

  templateUrl: './rental-request-detail.html',

  styleUrl: './rental-request-detail.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalRequestDetail {
  readonly store = inject(RentalsStore);

  readonly #iamStore = inject(IamStore);

  readonly #route = inject(ActivatedRoute);

  readonly #translate = inject(TranslateService);

  protected readonly editingDates = signal(false);
  protected readonly localDateIssue = signal<RentalReschedulingDateIssue | 'UNCHANGED'>(null);
  protected readonly rescheduleCopy = computed(() =>
    rentalRequestReschedulingCopy(this.#translate.currentLang() || 'es'),
  );

  protected readonly periodForm = new FormGroup({
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      const requestId = Number(this.#route.snapshot.paramMap.get('id'));

      if (userId === null || !Number.isInteger(requestId) || requestId <= 0) {
        this.store.clearRentalRequestDetail();

        return;
      }

      this.store.loadRentalRequestDetail(requestId, userId);
    });

    effect(() => {
      if (this.store.reschedulingSucceeded()) {
        this.editingDates.set(false);
        this.localDateIssue.set(null);
      }
    });
  }

  protected todayLima(): string {
    return RentalLifecycleDatePolicy.limaDay(new Date());
  }

  protected startEditingDates(request: RentalRequest): void {
    if (!request.isPending || request.constructionUserId !== this.#iamStore.currentUserId()) return;
    this.store.clearReschedulingFeedback();
    this.periodForm.setValue({
      startDate: this.formatDate(request.period.startDate),
      endDate: this.formatDate(request.period.endDate),
    });
    this.localDateIssue.set(null);
    this.editingDates.set(true);
  }

  protected cancelEditingDates(): void {
    if (this.store.reschedulingRequestId() !== null) return;
    this.editingDates.set(false);
    this.localDateIssue.set(null);
    this.store.clearReschedulingFeedback();
  }

  protected saveNewDates(request: RentalRequest): void {
    const userId = this.#iamStore.currentUserId();
    if (!this.editingDates() || !request.isPending || userId === null ||
        userId !== request.constructionUserId || this.store.reschedulingRequestId() !== null) return;

    this.periodForm.markAllAsTouched();
    const { startDate, endDate } = this.periodForm.getRawValue();
    const issue = RentalRequestReschedulingPolicy.issue(startDate, endDate);
    if (issue !== null) {
      this.localDateIssue.set(issue);
      return;
    }
    if (startDate === this.formatDate(request.period.startDate) &&
        endDate === this.formatDate(request.period.endDate)) {
      this.localDateIssue.set('UNCHANGED');
      return;
    }

    this.localDateIssue.set(null);
    const period = RentalRequestReschedulingPolicy.toPeriod(startDate, endDate);
    this.store.reschedulePendingRentalRequest(request.id, userId, period);
  }

  protected dateIssueMessage(): string {
    const issue = this.localDateIssue();
    if (issue === 'UNCHANGED') return this.rescheduleCopy().unchanged;
    return issue ? this.rescheduleCopy().dateIssues[issue] : '';
  }

  protected backendErrorMessage(): string {
    const issue = this.store.reschedulingError();
    return issue ? this.rescheduleCopy().errors[issue] : '';
  }

  protected equipmentName(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.name ?? `#${equipmentId}`;
  }

  protected equipmentCode(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.code ?? '-';
  }

  protected statusKey(status: RentalRequestStatus): string {
    return 'rentals.my-requests.status.' + status.toLowerCase();
  }

  protected statusClass(status: RentalRequestStatus): string {
    return status.toLowerCase();
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  }
}
