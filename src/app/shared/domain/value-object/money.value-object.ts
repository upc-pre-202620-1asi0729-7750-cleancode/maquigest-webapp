export class Money {
  #amount: number;
  #currency: string;

  constructor(props: { amount: number; currency: string }) {
    if (!Number.isFinite(props.amount) || props.amount < 0) {
      throw new Error('Money amount must be a valid non-negative number');
    }

    if (!props.currency.trim()) {
      throw new Error('Money currency is required');
    }

    this.#amount = props.amount;
    this.#currency = props.currency.trim().toUpperCase();
  }

  get amount(): number {
    return this.#amount;
  }

  set amount(value: number) {
    this.#amount = value;
  }

  get currency(): string {
    return this.#currency;
  }

  set currency(value: string) {
    this.#currency = value.trim().toUpperCase();
  }
}
