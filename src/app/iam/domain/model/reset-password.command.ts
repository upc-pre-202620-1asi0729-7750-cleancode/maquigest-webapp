export class ResetPasswordCommand {
  constructor(readonly token: string, readonly password: string) {}
}
