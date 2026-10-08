import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { Maintenance } from '../domain/model/maintenance.entity';

import { MaintenanceResource, MaintenancesResponse } from './maintenance-response';

export class MaintenanceAssembler implements BaseAssembler<
  Maintenance,
  MaintenanceResource,
  MaintenancesResponse
> {
  toEntitiesFromResponse(response: MaintenancesResponse): Maintenance[] {
    return response.maintenances.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: MaintenanceResource): Maintenance {
    return new Maintenance({
      id: resource.id,

      equipmentId: resource.equipmentId,

      performedAt: new Date(resource.performedAt),

      type: resource.type,

      status: resource.status,
    });
  }

  toResourceFromEntity(entity: Maintenance): MaintenanceResource {
    return {
      id: entity.id,

      equipmentId: entity.equipmentId,

      performedAt: entity.performedAt.toISOString(),

      type: entity.type,

      status: entity.status,
    };
  }
}
