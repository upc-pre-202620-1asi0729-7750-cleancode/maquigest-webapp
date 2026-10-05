import { Address } from '../value-object/address.value-object';

import { BaseEntity } from '../../../shared/domain/model/base-entity';


export class CompanyProfile implements BaseEntity {
  #id: number;
  #userId: number;
  #firstName: string;
  #lastName: string;
  #contactEmail: string;
  #phoneNumber: string;
  #companyName: string;
  #address: Address;

  constructor(props: {
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
    contactEmail: string;
    phoneNumber: string;
    companyName: string;
    address: Address;
  }) {
    this.#id = props.id;
    this.#userId = props.userId;
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
    this.#contactEmail = props.contactEmail;
    this.#phoneNumber = props.phoneNumber;
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

  get firstName(): string {
    return this.#firstName;
  }

  set firstName(value: string) {
    this.#firstName = value;
  }

  get lastName(): string {
    return this.#lastName;
  }

  set lastName(value: string) {
    this.#lastName = value;
  }

  get contactEmail(): string {
    return this.#contactEmail;
  }

  set contactEmail(value: string) {
    this.#contactEmail = value;
  }

  get phoneNumber(): string {
    return this.#phoneNumber;
  }

  set phoneNumber(value: string) {
    this.#phoneNumber = value;
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
