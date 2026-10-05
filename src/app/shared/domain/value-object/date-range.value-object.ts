export class DateRange {
  #startDate: Date;
  #endDate: Date;

  constructor(props: { startDate: Date; endDate: Date }) {
    if (Number.isNaN(props.startDate.getTime()) || Number.isNaN(props.endDate.getTime())) {
      throw new Error('Date range contains an invalid date');
    }

    if (props.startDate > props.endDate) {
      throw new Error('Start date must be before or equal to end date');
    }

    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
  }

  get startDate(): Date {
    return this.#startDate;
  }

  get endDate(): Date {
    return this.#endDate;
  }

  overlaps(other: DateRange): boolean {
    return this.#startDate <= other.endDate && this.#endDate >= other.startDate;
  }

  contains(date: Date): boolean {
    return date >= this.#startDate && date <= this.#endDate;
  }
}
