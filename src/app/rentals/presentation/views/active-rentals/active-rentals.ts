import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { RentalOperationSuccess, RentalsStore } from '../../../application/rentals.store';

import { Rental } from '../../../domain/model/rental.entity';

import { RentalLifecycleDatePolicy } from '../../../domain/policy/rental-lifecycle-date.policy';

import { RentalStatus } from '../../../domain/model/rental-status.enum';

import { DeliveryForm, DeliveryFormValue } from '../../components/delivery-form/delivery-form';

import { ReturnForm, ReturnFormValue } from '../../components/return-form/return-form';

@Component({
  selector: 'app-active-rentals',

  imports: [
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    TranslatePipe,
    DeliveryForm,
    ReturnForm,
  ],

  templateUrl: './active-rentals.html',

  styleUrl: './active-rentals.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveRentals {
  readonly store = inject(RentalsStore);

  readonly #iamStore = inject(IamStore);

  readonly #translate = inject(TranslateService);

  protected readonly displayedColumns = [
    'equipment',
    'customer',
    'startDate',
    'returnDate',
    'status',
    'actions',
  ];

  protected readonly dataSource = computed(
    () => new MatTableDataSource<Rental>(this.store.rentals()),
  );

  protected readonly deliveryRental = signal<Rental | null>(null);

  protected readonly returnRental = signal<Rental | null>(null);

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      if (userId === null) {
        this.store.clearRentals();

        return;
      }

      this.store.loadActiveRentalsForCompany(userId);
    });
  }

  protected equipmentName(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.name ?? `#${equipmentId}`;
  }

  protected equipmentCode(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.code ?? '-';
  }

  protected customerName(userId: number): string {
    const participant = this.store.getParticipantInformation(userId);

    if (!participant) {
      return `#${userId}`;
    }

    return participant.companyName;
  }

  protected customerContact(userId: number): string {
    const participant = this.store.getParticipantInformation(userId);

    if (!participant) {
      return '-';
    }

    return [participant.firstName, participant.lastName].filter(Boolean).join(' ');
  }

  protected statusKey(status: RentalStatus): string {
    return 'rentals.active.status.' + status.toLowerCase();
  }

  protected statusClass(status: RentalStatus): string {
    return status.toLowerCase();
  }

  protected returnIndicatorKey(rental: Rental): string {
    if (rental.isConfirmed) {
      return 'rentals.active.return-indicator.awaiting-delivery';
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const endDate = new Date(rental.period.endDate);

    endDate.setHours(0, 0, 0, 0);

    if (endDate < today) {
      return 'rentals.active.return-indicator.overdue';
    }

    const difference = endDate.getTime() - today.getTime();

    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

    if (days <= 7) {
      return 'rentals.active.return-indicator.due-soon';
    }

    return 'rentals.active.return-indicator.scheduled';
  }

  protected returnIndicatorClass(rental: Rental): string {
    if (rental.isConfirmed) {
      return 'awaiting';
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const endDate = new Date(rental.period.endDate);

    endDate.setHours(0, 0, 0, 0);

    if (endDate < today) {
      return 'overdue';
    }

    const difference = endDate.getTime() - today.getTime();

    const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

    return days <= 7 ? 'due-soon' : 'scheduled';
  }

  protected operationSuccessKey(operation: RentalOperationSuccess): string {
    return operation === 'DELIVERY'
      ? 'rentals.active.delivery.success'
      : 'rentals.active.return.success';
  }

  protected canRegisterDelivery(rental: Rental): boolean {
    return RentalLifecycleDatePolicy.canDeliverNow(rental);
  }

  protected deliveryUnavailableReason(rental: Rental): string {
    const today = RentalLifecycleDatePolicy.limaDay(new Date());
    const start = RentalLifecycleDatePolicy.limaDay(rental.period.startDate);
    const end = RentalLifecycleDatePolicy.limaDay(rental.period.endDate);
    const spanish = (this.#translate.currentLang() ?? 'es')
      .toLowerCase()
      .startsWith('es');

    const displayDate = (date: string): string => {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    };

    if (today < start) {
      return spanish
        ? `Entrega disponible desde el ${displayDate(start)}.`
        : `Delivery available from ${displayDate(start)}.`;
    }

    if (today > end) {
      return spanish
        ? `El plazo de entrega terminó el ${displayDate(end)}.`
        : `Delivery period ended on ${displayDate(end)}.`;
    }

    return spanish
      ? 'La entrega todavía no está disponible.'
      : 'Delivery is not available yet.';
  }

  protected openDelivery(rental: Rental): void {
    if (!this.canRegisterDelivery(rental)) return;
    this.store.clearOperationFeedback();

    this.returnRental.set(null);

    this.deliveryRental.set(rental);
  }

  protected closeDelivery(): void {
    this.deliveryRental.set(null);
  }

  protected submitDelivery(value: DeliveryFormValue): void {
    const rental = this.deliveryRental();

    if (!rental) {
      return;
    }

    this.deliveryRental.set(null);

    this.store.registerDelivery(rental.id, value.deliveredAt, value.notes);
  }

  protected openReturn(rental: Rental): void {
    this.store.clearOperationFeedback();

    this.deliveryRental.set(null);

    this.returnRental.set(rental);
  }

  protected closeReturn(): void {
    this.returnRental.set(null);
  }

  protected submitReturn(value: ReturnFormValue): void {
    const rental = this.returnRental();

    if (!rental) {
      return;
    }

    this.returnRental.set(null);

    this.store.registerReturn(rental.id, value.returnedAt, value.notes, value.maintenanceRequired);
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  }
}
