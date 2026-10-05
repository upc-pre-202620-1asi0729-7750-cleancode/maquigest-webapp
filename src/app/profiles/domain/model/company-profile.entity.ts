import { Address } from '../value-object/address.value-object';

export class CompanyProfile {
  #id: number;
  #userId: number;
  #companyName: string;
  #address: Address;

  constructor(props: { id: number; userId: number; companyName: string; address: Address }) {
    this.#id = props.id;
    this.#userId = props.userId;
    this.#companyName = props.companyName;
    this.#address = props.address;
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

  get companyName(): string {
    return this.#companyName;
  }

  set companyName(value: string) {
    this.#companyName = value;
  }

  get address(): Address {
    return this.#address;
  }

  set address(value: Address) {
    this.#address = value;
  }
}
