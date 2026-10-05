export class Profile {
  #id: number;
  #userId: number;
  #firstName: string;
  #lastName: string;
  #contactEmail: string;
  #phoneNumber: string;

  constructor(props: {
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
    contactEmail: string;
    phoneNumber: string;
  }) {
    this.#id = props.id;
    this.#userId = props.userId;
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
    this.#contactEmail = props.contactEmail;
    this.#phoneNumber = props.phoneNumber;
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
}
