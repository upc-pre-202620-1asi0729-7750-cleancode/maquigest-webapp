import { BaseEntity } from '../../../shared/domain/model/base-entity';

import { Money } from '../../../shared/domain/value-object/money.value-object';

import { PlanStatus } from './plan-status.enum';

export class SubscriptionPlan implements BaseEntity {
  #id: number;
  #name: string;
  #description: string;
  #price: Money;
  #billingCycle: string;
  #status: PlanStatus;

  constructor(props: {
    id: number;
    name: string;
    description: string;
    price: Money;
    billingCycle: string;
    status?: PlanStatus;
  }) {
    this.#id = props.id;
    this.#name = props.name;
    this.#description = props.description;
    this.#price = props.price;
    this.#billingCycle = props.billingCycle;

    this.#status = props.status ?? PlanStatus.ACTIVE;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get name(): string {
    return this.#name;
  }

  set name(value: string) {
    this.#name = value;
  }

  get description(): string {
    return this.#description;
  }

  set description(value: string) {
    this.#description = value;
  }

  get price(): Money {
    return this.#price;
  }

  set price(value: Money) {
    this.#price = value;
  }

  get billingCycle(): string {
    return this.#billingCycle;
  }

  set billingCycle(value: string) {
    this.#billingCycle = value;
  }

  get status(): PlanStatus {
    return this.#status;
  }

  set status(value: PlanStatus) {
    this.#status = value;
  }
}
