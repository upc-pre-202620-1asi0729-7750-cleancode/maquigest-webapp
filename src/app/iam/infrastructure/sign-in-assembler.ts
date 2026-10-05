import { SignInCommand } from '../domain/model/sign-in.command';
import { SignInRequest } from './sign-in.request';
import { SignInResource, SignInResponse } from './sign-in-response';

export class SignInAssembler {
  toRequestFromCommand(command: SignInCommand): SignInRequest {
    return {
      email: command.email,
      password: command.password,
    };
  }

  toResourceFromResponse(response: SignInResponse): SignInResource {
    return {
      id: response.id,
      email: response.email,
      role: response.role,
      status: response.status,
      token: response.token,
    };
  }
}
