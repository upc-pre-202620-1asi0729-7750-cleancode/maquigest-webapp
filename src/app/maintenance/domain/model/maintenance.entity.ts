import { BaseEntity } from '../../../shared/domain/model/base-entity';

import { MaintenanceStatus } from './maintenance-status.enum';

export class Maintenance implements BaseEntity {
  #id: number;

  #equipmentId: number;

  #performedAt: Date;

  #type: string;

  #status: MaintenanceStatus;

  constructor(props: {
    id: number;
    equipmentId: number;
    performedAt: Date;
    type: string;
    status?: MaintenanceStatus;
  }) {
    if (props.equipmentId <= 0) {
      throw new Error('Equipment id is invalid');
    }

    if (Number.isNaN(props.performedAt.getTime())) {
      throw new Error('Maintenance date is invalid');
    }

    if (!props.type.trim()) {
      throw new Error('Maintenance type is required');
    }

    this.#id = props.id;

    this.#equipmentId = props.equipmentId;

    this.#performedAt = props.performedAt;

    this.#type = props.type.trim();

    this.#status = props.status ?? MaintenanceStatus.COMPLETED;
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
    if (value <= 0) {
      throw new Error('Equipment id is invalid');
    }

    this.#equipmentId = value;
  }

  get performedAt(): Date {
    return this.#performedAt;
  }

  set performedAt(value: Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Maintenance date is invalid');
    }

    this.#performedAt = value;
  }

  get type(): string {
    return this.#type;
  }

  set type(value: string) {
    if (!value.trim()) {
      throw new Error('Maintenance type is required');
    }

    this.#type = value.trim();
  }

  get status(): MaintenanceStatus {
    return this.#status;
  }

  set status(value: MaintenanceStatus) {
    this.#status = value;
  }
}
