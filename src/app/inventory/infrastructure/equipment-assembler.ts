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
        startDate: this.#calendarDateFromApi(resource.startDate),

        endDate: this.#calendarDateFromApi(resource.endDate, true),
      }),
    });
  }

  // The API stores inclusive calendar days. Compare them against the date
  // input in local calendar time, with the final day included until 23:59:59.999.
  #calendarDateFromApi(value: string, endOfDay = false): Date {
    const day = value.slice(0, 10);
    return new Date(`${day}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  }

  #toAvailabilityBlockResource(block: AvailabilityBlock): AvailabilityBlockResource {
    return {
      id: block.id,

      startDate: block.period.startDate.toISOString(),

      endDate: block.period.endDate.toISOString(),
    };
  }
}
