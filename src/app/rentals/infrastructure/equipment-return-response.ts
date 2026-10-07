import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface EquipmentReturnsResponse extends BaseResponse {
  equipmentReturns: EquipmentReturnResource[];
}

export interface EquipmentReturnResource extends BaseResource {
  id: number;

  rentalId: number;

  returnedAt: string;

  notes: string;

  maintenanceRequired: boolean;
}
