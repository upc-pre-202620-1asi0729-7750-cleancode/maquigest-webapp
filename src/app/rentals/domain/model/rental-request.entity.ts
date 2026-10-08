import { BaseEntity } from '../../../shared/domain/model/base-entity';

import { DateRange } from '../../../shared/domain/value-object/date-range.value-object';

import { RentalRequestStatus } from './rental-request-status.enum';

export class RentalRequest implements BaseEntity {
  #id: number;
  #equipmentId: number;
  #constructionUserId: number;
  #rentalCompanyUserId: number;
  #period: DateRange;
  #status: RentalRequestStatus;
  #createdAt: Date;

  constructor(props: {
    id: number;
    equipmentId: number;
    constructionUserId: number;
    rentalCompanyUserId: number;
    period: DateRange;
    status?: RentalRequestStatus;
    createdAt?: Date;
  }) {
    this.#id = props.id;
    this.#equipmentId = props.equipmentId;
    this.#constructionUserId = props.constructionUserId;
    this.#rentalCompanyUserId = props.rentalCompanyUserId;
    this.#period = props.period;
    this.#status = props.status ?? RentalRequestStatus.PENDING;
    this.#createdAt = props.createdAt ?? new Date();
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

  get status(): RentalRequestStatus {
    return this.#status;
  }

  set status(value: RentalRequestStatus) {
    this.#status = value;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  set createdAt(value: Date) {
    this.#createdAt = value;
  }

  get isPending(): boolean {
    return this.#status === RentalRequestStatus.PENDING;
  }

  approve(): void {
    this.#ensurePending();

    this.#status = RentalRequestStatus.APPROVED;
  }

  reject(): void {
    this.#ensurePending();

    this.#status = RentalRequestStatus.REJECTED;
  }

  #ensurePending(): void {
    if (!this.isPending) {
      throw new Error('Only pending rental requests can be updated');
    }
  }
}
