import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface SignInResponse extends BaseResponse, SignInResource {}

export interface SignInResource extends BaseResource {
  email: string;
  role: string;
  status: string;
  token: string;
}
