import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface ProfilesResponse extends BaseResponse {
  profiles: ProfileResource[];
}

export interface ProfileResource extends BaseResource {
  id: number;
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
