export class VerifyEmailCommand {
  constructor(readonly token: string, readonly password: string) {}
}
