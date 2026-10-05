export class SignInCommand {
  #email: string;
  #password: string;

  constructor(props: { email: string; password: string }) {
    this.#email = props.email;
    this.#password = props.password;
  }

  get email(): string {
    return this.#email;
  }

  set email(value: string) {
    this.#email = value;
  }

  get password(): string {
    return this.#password;
  }

  set password(value: string) {
    this.#password = value;
  }
}
