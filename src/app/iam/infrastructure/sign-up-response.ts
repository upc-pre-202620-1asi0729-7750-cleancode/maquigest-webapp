import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface SignUpResponse extends BaseResponse, SignUpResource {}

export interface SignUpResource extends BaseResource {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  role: string;
  status: string;
}
