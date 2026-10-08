import { BaseEntity } from '../../../shared/domain/model/base-entity';

import { DateRange } from '../../../shared/domain/value-object/date-range.value-object';

import { RentalStatus } from './rental-status.enum';

export class Rental implements BaseEntity {
  #id: number;

  #equipmentId: number;

  #constructionUserId: number;

  #rentalCompanyUserId: number;

  #period: DateRange;

  #status: RentalStatus;

  constructor(props: {
    id: number;
    equipmentId: number;
    constructionUserId: number;
    rentalCompanyUserId: number;
    period: DateRange;
    status?: RentalStatus;
  }) {
    this.#id = props.id;

    this.#equipmentId = props.equipmentId;

    this.#constructionUserId = props.constructionUserId;

    this.#rentalCompanyUserId = props.rentalCompanyUserId;

    this.#period = props.period;

    this.#status = props.status ?? RentalStatus.CONFIRMED;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get equipmentId(): number {
    return this.#equipmentId;
  }

  set equipmentId(value: number) {
    this.#equipmentId = value;
  }

  get constructionUserId(): number {
    return this.#constructionUserId;
  }

  set constructionUserId(value: number) {
    this.#constructionUserId = value;
  }

  get rentalCompanyUserId(): number {
    return this.#rentalCompanyUserId;
  }

  set rentalCompanyUserId(value: number) {
    this.#rentalCompanyUserId = value;
  }

  get period(): DateRange {
    return this.#period;
  }

  set period(value: DateRange) {
    this.#period = value;
  }

  get status(): RentalStatus {
    return this.#status;
  }

  set status(value: RentalStatus) {
    this.#status = value;
  }

  get isConfirmed(): boolean {
    return this.#status === RentalStatus.CONFIRMED;
  }

  get isActive(): boolean {
    return this.#status === RentalStatus.ACTIVE;
  }

  get isCompleted(): boolean {
    return this.#status === RentalStatus.COMPLETED;
  }

  registerDelivery(): void {
    if (!this.isConfirmed) {
      throw new Error('Only confirmed rentals can register a delivery');
    }

    this.#status = RentalStatus.ACTIVE;
  }

  registerReturn(): void {
    if (!this.isActive) {
      throw new Error('Only active rentals can register a return');
    }

    this.#status = RentalStatus.COMPLETED;
  }
}
