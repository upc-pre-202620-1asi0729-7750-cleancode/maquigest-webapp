import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { Equipment } from '../domain/model/equipment.entity';
import { RentalRate } from '../domain/value-object/rental-rate.value-object';

import { EquipmentResource, EquipmentsResponse } from './equipment-response';

export class EquipmentAssembler implements BaseAssembler<
  Equipment,
  EquipmentResource,
  EquipmentsResponse
> {
  toEntitiesFromResponse(response: EquipmentsResponse): Equipment[] {
    return response.equipments.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: EquipmentResource): Equipment {
    return new Equipment({
      id: resource.id,
      userId: resource.userId,
      code: resource.code,
      name: resource.name,
      description: resource.description,
      categoryId: resource.categoryId,
      location: resource.location,
      rentalRate: new RentalRate({
        dailyRate: resource.dailyRate,
        weeklyRate: resource.weeklyRate,
      }),
      status: resource.status,
    });
  }

  toResourceFromEntity(entity: Equipment): EquipmentResource {
    return {
      id: entity.id,
      userId: entity.userId,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      categoryId: entity.categoryId,
      location: entity.location,
      dailyRate: entity.rentalRate.dailyRate,
      weeklyRate: entity.rentalRate.weeklyRate,
      status: entity.status,
    };
  }
}
