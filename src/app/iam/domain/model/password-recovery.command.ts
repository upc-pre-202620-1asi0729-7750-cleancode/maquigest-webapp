/** Command used to request password recovery without exposing account existence. */
export class PasswordRecoveryCommand {
  constructor(public readonly email: string) {}
}
