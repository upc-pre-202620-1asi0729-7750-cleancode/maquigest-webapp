import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class EquipmentReturn implements BaseEntity {
  #id: number;

  #rentalId: number;

  #returnedAt: Date;

  #notes: string;

  #maintenanceRequired: boolean;

  constructor(props: {
    id: number;
    rentalId: number;
    returnedAt: Date;
    notes?: string;
    maintenanceRequired?: boolean;
  }) {
    if (Number.isNaN(props.returnedAt.getTime())) {
      throw new Error('Return date is invalid');
    }

    this.#id = props.id;

    this.#rentalId = props.rentalId;

    this.#returnedAt = props.returnedAt;

    this.#notes = props.notes ?? '';

    this.#maintenanceRequired = props.maintenanceRequired ?? false;
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

  get returnedAt(): Date {
    return this.#returnedAt;
  }

  set returnedAt(value: Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Return date is invalid');
    }

    this.#returnedAt = value;
  }

  get notes(): string {
    return this.#notes;
  }

  set notes(value: string) {
    this.#notes = value;
  }

  get maintenanceRequired(): boolean {
    return this.#maintenanceRequired;
  }

  set maintenanceRequired(value: boolean) {
    this.#maintenanceRequired = value;
  }

  requiresMaintenance(): boolean {
    return this.#maintenanceRequired;
  }
}
