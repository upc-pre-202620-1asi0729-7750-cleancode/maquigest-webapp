import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface EquipmentCategoriesResponse extends BaseResponse {
  categories: EquipmentCategoryResource[];
}

export interface EquipmentCategoryResource extends BaseResource {
  id: number;
  name: string;
}
