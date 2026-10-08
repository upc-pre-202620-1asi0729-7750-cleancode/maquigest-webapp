import { BaseEntity } from '../../../shared/domain/model/base-entity';

import { IncidentStatus } from './incident-status.enum';

export class Incident implements BaseEntity {
  #id: number;
  #equipmentId: number;
  #description: string;
  #reportedAt: Date;
  #blocksRental: boolean;
  #status: IncidentStatus;
  #resolvedAt: Date | null;

  constructor(props: {
    id: number;
    equipmentId: number;
    description: string;
    reportedAt: Date;
    blocksRental?: boolean;
    status?: IncidentStatus;
    resolvedAt?: Date | null;
  }) {
    if (!Number.isInteger(props.id) || props.id < 0) {
      throw new Error('Incident id is invalid');
    }

    if (!Number.isInteger(props.equipmentId) || props.equipmentId <= 0) {
      throw new Error('Equipment id is invalid');
    }

    if (!props.description.trim()) {
      throw new Error('Incident description is required');
    }

    if (Number.isNaN(props.reportedAt.getTime())) {
      throw new Error('Incident date is invalid');
    }

    if (
      props.blocksRental !== undefined &&
      typeof props.blocksRental !== 'boolean'
    ) {
      throw new Error('Incident rental restriction is invalid');
    }

    const status = props.status ?? IncidentStatus.OPEN;

    if (!Object.values(IncidentStatus).includes(status)) {
      throw new Error('Incident status is invalid');
    }

    const resolvedAt = props.resolvedAt ?? null;

    if (resolvedAt !== null && Number.isNaN(resolvedAt.getTime())) {
      throw new Error('Incident resolution date is invalid');
    }

    if (status === IncidentStatus.RESOLVED && resolvedAt === null) {
      throw new Error('Resolved incident requires a resolution date');
    }

    if (status === IncidentStatus.OPEN && resolvedAt !== null) {
      throw new Error('Open incident cannot have a resolution date');
    }

    this.#id = props.id;
    this.#equipmentId = props.equipmentId;
    this.#description = props.description.trim();
    this.#reportedAt = new Date(props.reportedAt);
    this.#blocksRental = props.blocksRental ?? false;
    this.#status = status;
    this.#resolvedAt = resolvedAt ? new Date(resolvedAt) : null;
  }

  static report(props: {
    equipmentId: number;
    description: string;
    blocksRental?: boolean;
  }): Incident {
    return new Incident({
      id: 0,
      equipmentId: props.equipmentId,
      description: props.description,
      reportedAt: new Date(),
      blocksRental: props.blocksRental ?? false,
      status: IncidentStatus.OPEN,
      resolvedAt: null,
    });
  }

  requireRentalRestriction(): void {
    if (this.#status !== IncidentStatus.OPEN) {
      throw new Error('Only open incidents can require rental restriction');
    }

    if (this.#blocksRental) {
      throw new Error('Incident already blocks rental');
    }

    this.#blocksRental = true;
  }

  resolve(resolvedAt: Date = new Date()): void {
    if (this.#status === IncidentStatus.RESOLVED) {
      throw new Error('Incident is already resolved');
    }

    if (Number.isNaN(resolvedAt.getTime())) {
      throw new Error('Incident resolution date is invalid');
    }

    if (resolvedAt.getTime() < this.#reportedAt.getTime()) {
      throw new Error('Resolution cannot precede incident report');
    }

    this.#status = IncidentStatus.RESOLVED;
    this.#resolvedAt = new Date(resolvedAt);
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Incident id is invalid');
    }

    this.#id = value;
  }

  get equipmentId(): number {
    return this.#equipmentId;
  }

  set equipmentId(value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Equipment id is invalid');
    }

    this.#equipmentId = value;
  }

  get description(): string {
    return this.#description;
  }

  set description(value: string) {
    if (!value.trim()) {
      throw new Error('Incident description is required');
    }

    this.#description = value.trim();
  }

  get reportedAt(): Date {
    return new Date(this.#reportedAt);
  }

  set reportedAt(value: Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Incident date is invalid');
    }

    this.#reportedAt = new Date(value);
  }

  get blocksRental(): boolean {
    return this.#blocksRental;
  }

  get status(): IncidentStatus {
    return this.#status;
  }

  get resolvedAt(): Date | null {
    return this.#resolvedAt ? new Date(this.#resolvedAt) : null;
  }
}
