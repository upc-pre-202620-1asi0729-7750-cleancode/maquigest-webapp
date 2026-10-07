import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { EquipmentReturn } from '../domain/model/equipment-return.entity';

import { EquipmentReturnResource, EquipmentReturnsResponse } from './equipment-return-response';

export class EquipmentReturnAssembler implements BaseAssembler<
  EquipmentReturn,
  EquipmentReturnResource,
  EquipmentReturnsResponse
> {
  toEntitiesFromResponse(response: EquipmentReturnsResponse): EquipmentReturn[] {
    return response.equipmentReturns.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: EquipmentReturnResource): EquipmentReturn {
    return new EquipmentReturn({
      id: resource.id,

      rentalId: resource.rentalId,

      returnedAt: new Date(resource.returnedAt),

      notes: resource.notes,

      maintenanceRequired: resource.maintenanceRequired,
    });
  }

  toResourceFromEntity(entity: EquipmentReturn): EquipmentReturnResource {
    return {
      id: entity.id,

      rentalId: entity.rentalId,

      returnedAt: entity.returnedAt.toISOString(),

      notes: entity.notes,

      maintenanceRequired: entity.maintenanceRequired,
    };
  }
}
