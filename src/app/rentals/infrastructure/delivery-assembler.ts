import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { Delivery } from '../domain/model/delivery.entity';

import { DeliveriesResponse, DeliveryResource } from './delivery-response';

export class DeliveryAssembler implements BaseAssembler<
  Delivery,
  DeliveryResource,
  DeliveriesResponse
> {
  toEntitiesFromResponse(response: DeliveriesResponse): Delivery[] {
    return response.deliveries.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: DeliveryResource): Delivery {
    return new Delivery({
      id: resource.id,

      rentalId: resource.rentalId,

      deliveredAt: new Date(resource.deliveredAt),

      notes: resource.notes,
    });
  }

  toResourceFromEntity(entity: Delivery): DeliveryResource {
    return {
      id: entity.id,

      rentalId: entity.rentalId,

      deliveredAt: entity.deliveredAt.toISOString(),

      notes: entity.notes,
    };
  }
}
