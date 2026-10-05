import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { DateRange } from '../../shared/domain/value-object/date-range.value-object';

import { RentalRequest } from '../domain/model/rental-request.entity';

import { RentalRequestResource, RentalRequestsResponse } from './rental-request-response';

export class RentalRequestAssembler implements BaseAssembler<
  RentalRequest,
  RentalRequestResource,
  RentalRequestsResponse
> {
  toEntitiesFromResponse(response: RentalRequestsResponse): RentalRequest[] {
    return response.rentalRequests.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: RentalRequestResource): RentalRequest {
    return new RentalRequest({
      id: resource.id,

      equipmentId: resource.equipmentId,

      constructionUserId: resource.constructionUserId,

      rentalCompanyUserId: resource.rentalCompanyUserId,

      period: new DateRange({
        startDate: new Date(resource.startDate),

        endDate: new Date(resource.endDate),
      }),

      status: resource.status,

      createdAt: new Date(resource.createdAt),
    });
  }

  toResourceFromEntity(entity: RentalRequest): RentalRequestResource {
    return {
      id: entity.id,

      equipmentId: entity.equipmentId,

      constructionUserId: entity.constructionUserId,

      rentalCompanyUserId: entity.rentalCompanyUserId,

      startDate: entity.period.startDate.toISOString(),

      endDate: entity.period.endDate.toISOString(),

      status: entity.status,

      createdAt: entity.createdAt.toISOString(),
    };
  }
}
