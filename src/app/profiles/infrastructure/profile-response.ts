import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface ProfileResponse extends BaseResponse, ProfileResource {}

export interface ProfileResource extends BaseResource {
  userId: number;

  firstName: string;
  lastName: string;
  contactEmail: string;
  phoneNumber: string;

  companyName: string;

  address: {
    street: string;
    district: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
}
