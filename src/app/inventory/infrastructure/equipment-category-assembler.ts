import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { EquipmentCategory } from '../domain/model/equipment-category.entity';

import {
  EquipmentCategoriesResponse,
  EquipmentCategoryResource,
} from './equipment-categories-response';

export class EquipmentCategoryAssembler implements BaseAssembler<
  EquipmentCategory,
  EquipmentCategoryResource,
  EquipmentCategoriesResponse
> {
  toEntitiesFromResponse(response: EquipmentCategoriesResponse): EquipmentCategory[] {
    return response.categories.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: EquipmentCategoryResource): EquipmentCategory {
    return new EquipmentCategory({
      id: resource.id,
      name: resource.name,
    });
  }

  toResourceFromEntity(entity: EquipmentCategory): EquipmentCategoryResource {
    return {
      id: entity.id,
      name: entity.name,
    };
  }
}
