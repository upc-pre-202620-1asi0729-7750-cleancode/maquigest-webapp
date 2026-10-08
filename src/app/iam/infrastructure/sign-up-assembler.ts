import { SignUpCommand } from '../domain/model/sign-up.command';
import { SignUpRequest } from './sign-up.request';
import { SignUpResource, SignUpResponse } from './sign-up-response';

export class SignUpAssembler {
  toRequestFromCommand(command: SignUpCommand): SignUpRequest {
    return {
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      password: command.password,
      companyName: command.companyName,
      role: command.role,
      status: 'active',
    };
  }

  toResourceFromResponse(response: SignUpResponse): SignUpResource {
    return {
      id: response.id,
      firstName: response.firstName,
      lastName: response.lastName,
      email: response.email,
      companyName: response.companyName,
      role: response.role,
      status: response.status,
    };
  }
}
