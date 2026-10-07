import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

import { RentalStatus } from '../domain/model/rental-status.enum';

export interface RentalsResponse extends BaseResponse {
  rentals: RentalResource[];
}

export interface RentalResource extends BaseResource {
  id: number;

  equipmentId: number;

  constructionUserId: number;

  rentalCompanyUserId: number;

  startDate: string;

  endDate: string;

  status: RentalStatus;
}
