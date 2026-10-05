import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

import { EquipmentStatus } from '../domain/model/equipment-status.enum';

export interface EquipmentsResponse extends BaseResponse {
  equipments: EquipmentResource[];
}

export interface AvailabilityBlockResource extends BaseResource {
  id: number;
  startDate: string;
  endDate: string;
}

export interface EquipmentResource extends BaseResource {
  id: number;
  userId: number;
  code: string;
  name: string;
  description: string;
  categoryId: number;
  location: string;
  dailyRate: number;
  weeklyRate: number;
  status: EquipmentStatus;
  availabilityBlocks?: AvailabilityBlockResource[];
}
