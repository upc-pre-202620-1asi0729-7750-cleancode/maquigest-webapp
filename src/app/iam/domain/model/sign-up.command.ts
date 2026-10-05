export class SignUpCommand {
  #firstName: string;
  #lastName: string;
  #email: string;
  #password: string;
  #companyName: string;
  #role: string;

  constructor(props: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName: string;
    role: string;
  }) {
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
    this.#email = props.email;
    this.#password = props.password;
    this.#companyName = props.companyName;
    this.#role = props.role;
  }

  get firstName(): string {
    return this.#firstName;
  }

  get lastName(): string {
    return this.#lastName;
  }

  get email(): string {
    return this.#email;
  }

  get password(): string {
    return this.#password;
  }

  get companyName(): string {
    return this.#companyName;
  }

  get role(): string {
    return this.#role;
  }
}
