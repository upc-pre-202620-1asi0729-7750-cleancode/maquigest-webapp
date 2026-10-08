import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { Incident } from '../domain/model/incident.entity';
import { IncidentStatus } from '../domain/model/incident-status.enum';

import {
  IncidentResource,
  IncidentsResponse,
} from './incident-response';

export class IncidentAssembler implements BaseAssembler<
  Incident,
  IncidentResource,
  IncidentsResponse
> {
  toEntitiesFromResponse(response: IncidentsResponse): Incident[] {
    return response.incidents.map((resource) =>
      this.toEntityFromResource(resource),
    );
  }

  toEntityFromResource(resource: IncidentResource): Incident {
    const status = resource.status ?? IncidentStatus.OPEN;

    return new Incident({
      id: resource.id,
      equipmentId: resource.equipmentId,
      description: resource.description,
      reportedAt: new Date(resource.reportedAt),
      blocksRental: resource.blocksRental ?? false,
      status,
      resolvedAt: resource.resolvedAt
        ? new Date(resource.resolvedAt)
        : null,
    });
  }

  toResourceFromEntity(entity: Incident): IncidentResource {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      description: entity.description,
      reportedAt: entity.reportedAt.toISOString(),
      blocksRental: entity.blocksRental,
      status: entity.status,
      resolvedAt: entity.resolvedAt?.toISOString() ?? null,
    };
  }
}
