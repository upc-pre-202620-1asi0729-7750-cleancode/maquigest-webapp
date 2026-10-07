import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { DateRange } from '../../shared/domain/value-object/date-range.value-object';

import { Rental } from '../domain/model/rental.entity';

import { RentalResource, RentalsResponse } from './rental-response';

export class RentalAssembler implements BaseAssembler<Rental, RentalResource, RentalsResponse> {
  toEntitiesFromResponse(response: RentalsResponse): Rental[] {
    return response.rentals.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: RentalResource): Rental {
    return new Rental({
      id: resource.id,

      equipmentId: resource.equipmentId,

      constructionUserId: resource.constructionUserId,

      rentalCompanyUserId: resource.rentalCompanyUserId,

      period: new DateRange({
        startDate: new Date(resource.startDate),

        endDate: new Date(resource.endDate),
      }),

      status: resource.status,
    });
  }

  toResourceFromEntity(entity: Rental): RentalResource {
    return {
      id: entity.id,

      equipmentId: entity.equipmentId,

      constructionUserId: entity.constructionUserId,

      rentalCompanyUserId: entity.rentalCompanyUserId,

      startDate: entity.period.startDate.toISOString(),

      endDate: entity.period.endDate.toISOString(),

      status: entity.status,
    };
  }
}
