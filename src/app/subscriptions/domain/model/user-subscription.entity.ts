import { BaseEntity } from '../../../shared/domain/model/base-entity';

import { DateRange } from '../../../shared/domain/value-object/date-range.value-object';

import { SubscriptionStatus } from './subscription-status.enum';

export class UserSubscription implements BaseEntity {
  #id: number;
  #userId: number;
  #planId: number;
  #period: DateRange;
  #status: SubscriptionStatus;
  #autoRenew: boolean;

  constructor(props: {
    id: number;
    userId: number;
    planId: number;
    period: DateRange;
    status?: SubscriptionStatus;
    autoRenew?: boolean;
  }) {
    this.#id = props.id;
    this.#userId = props.userId;
    this.#planId = props.planId;
    this.#period = props.period;

    this.#status = props.status ?? SubscriptionStatus.ACTIVE;

    this.#autoRenew = props.autoRenew ?? true;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get userId(): number {
    return this.#userId;
  }

  set userId(value: number) {
    this.#userId = value;
  }

  get planId(): number {
    return this.#planId;
  }

  set planId(value: number) {
    this.#planId = value;
  }

  get period(): DateRange {
    return this.#period;
  }

  set period(value: DateRange) {
    this.#period = value;
  }

  get status(): SubscriptionStatus {
    return this.#status;
  }

  set status(value: SubscriptionStatus) {
    this.#status = value;
  }

  get autoRenew(): boolean {
    return this.#autoRenew;
  }

  set autoRenew(value: boolean) {
    this.#autoRenew = value;
  }
}
