import { Address } from '../value-object/address.value-object';

export class UpdateProfileCommand {
  #userId: number;
  #firstName: string;
  #lastName: string;
  #contactEmail: string;
  #phoneNumber: string;
  #companyName: string;
  #address: Address;

  constructor(props: {
    userId: number;
    firstName: string;
    lastName: string;
    contactEmail: string;
    phoneNumber: string;
    companyName: string;
    address: Address;
  }) {
    this.#userId = props.userId;
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
    this.#contactEmail = props.contactEmail;
    this.#phoneNumber = props.phoneNumber;
    this.#companyName = props.companyName;
    this.#address = props.address;
  }

  get userId(): number {
    return this.#userId;
  }

  get firstName(): string {
    return this.#firstName;
  }

  get lastName(): string {
    return this.#lastName;
  }

  get contactEmail(): string {
    return this.#contactEmail;
  }

  get phoneNumber(): string {
    return this.#phoneNumber;
  }

  get companyName(): string {
    return this.#companyName;
  }

  get address(): Address {
    return this.#address;
  }
}
