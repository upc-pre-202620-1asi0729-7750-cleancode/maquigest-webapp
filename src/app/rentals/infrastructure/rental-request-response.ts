import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

import { RentalRequestStatus } from '../domain/model/rental-request-status.enum';

export interface RentalRequestsResponse extends BaseResponse {
  rentalRequests: RentalRequestResource[];
}

export interface RentalRequestResource extends BaseResource {
  id: number;
  equipmentId: number;
  constructionUserId: number;
  rentalCompanyUserId: number;
  startDate: string;
  endDate: string;
  status: RentalRequestStatus;
  createdAt: string;
}
