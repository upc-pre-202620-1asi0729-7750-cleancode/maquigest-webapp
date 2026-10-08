import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { DateRange } from '../../../shared/domain/value-object/date-range.value-object';

export class AvailabilityBlock implements BaseEntity {
  #id: number;
  #period: DateRange;

  constructor(props: { id: number; period: DateRange }) {
    this.#id = props.id;
    this.#period = props.period;
  }

  get id(): number {
    return this.#id;
  }

  set id(value: number) {
    this.#id = value;
  }

  get period(): DateRange {
    return this.#period;
  }

  set period(value: DateRange) {
    this.#period = value;
  }

  overlaps(period: DateRange): boolean {
    return this.#period.overlaps(period);
  }
}
