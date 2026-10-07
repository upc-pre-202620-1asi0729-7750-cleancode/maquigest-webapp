import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class Delivery implements BaseEntity {
  #id: number;

  #rentalId: number;

  #deliveredAt: Date;

  #notes: string;

  constructor(props: { id: number; rentalId: number; deliveredAt: Date; notes?: string }) {
    if (Number.isNaN(props.deliveredAt.getTime())) {
      throw new Error('Delivery date is invalid');
    }

    this.#id = props.id;

    this.#rentalId = props.rentalId;

    this.#deliveredAt = props.deliveredAt;

    this.#notes = props.notes ?? '';
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get rentalId(): number {
    return this.#rentalId;
  }

  set rentalId(value: number) {
    this.#rentalId = value;
  }

  get deliveredAt(): Date {
    return this.#deliveredAt;
  }

  set deliveredAt(value: Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Delivery date is invalid');
    }

    this.#deliveredAt = value;
  }

  get notes(): string {
    return this.#notes;
  }

  set notes(value: string) {
    this.#notes = value;
  }
}
