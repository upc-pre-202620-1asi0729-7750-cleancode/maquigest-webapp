export class RentalRate {
  #dailyRate: number;
  #weeklyRate: number;

  constructor(props: { dailyRate: number; weeklyRate: number }) {
    if (props.dailyRate <= 0) {
      throw new Error('Daily rate must be greater than zero');
    }

    if (props.weeklyRate <= 0) {
      throw new Error('Weekly rate must be greater than zero');
    }

    this.#dailyRate = props.dailyRate;
    this.#weeklyRate = props.weeklyRate;
  }

  get dailyRate(): number {
    return this.#dailyRate;
  }

  get weeklyRate(): number {
    return this.#weeklyRate;
  }
}
