import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { DateRange } from '../../shared/domain/value-object/date-range.value-object';

import { Equipment } from '../domain/model/equipment.entity';
import { AvailabilityBlock } from '../domain/model/availability-block.entity';
import { RentalRate } from '../domain/value-object/rental-rate.value-object';

import {
  AvailabilityBlockResource,
  EquipmentResource,
  EquipmentsResponse,
} from './equipment-response';

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

      availabilityBlocks: (resource.availabilityBlocks ?? []).map((block) =>
        this.#toAvailabilityBlock(block),
      ),
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

      availabilityBlocks: entity.availabilityBlocks.map((block) =>
        this.#toAvailabilityBlockResource(block),
      ),
    };
  }

  #toAvailabilityBlock(resource: AvailabilityBlockResource): AvailabilityBlock {
    return new AvailabilityBlock({
      id: resource.id,

      period: new DateRange({
        startDate: new Date(resource.startDate),

        endDate: new Date(resource.endDate),
      }),
    });
  }

  #toAvailabilityBlockResource(block: AvailabilityBlock): AvailabilityBlockResource {
    return {
      id: block.id,

      startDate: block.period.startDate.toISOString(),

      endDate: block.period.endDate.toISOString(),
    };
  }
}
