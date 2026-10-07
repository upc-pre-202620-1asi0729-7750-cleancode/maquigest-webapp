import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface DeliveriesResponse extends BaseResponse {
  deliveries: DeliveryResource[];
}

export interface DeliveryResource extends BaseResource {
  id: number;

  rentalId: number;

  deliveredAt: string;

  notes: string;
}
