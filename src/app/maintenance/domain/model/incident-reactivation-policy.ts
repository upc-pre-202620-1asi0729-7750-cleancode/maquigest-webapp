import { Incident } from './incident.entity';
import { IncidentStatus } from './incident-status.enum';

/** Business rule: a machine may be reactivated only after its blocking incidents have been resolved. */
export class IncidentReactivationPolicy {
  static canReactivate(
    equipmentId: number,
    incidents: readonly Incident[],
  ): boolean {
    const related = incidents.filter(
      (incident) => incident.equipmentId === equipmentId,
    );

    // The reactivation workflow is available only for a machine that had a blocking incident.
    const hadBlockingIncident = related.some(
      (incident) => incident.blocksRental,
    );

    const hasUnresolvedBlocker = related.some(
      (incident) =>
        incident.blocksRental && incident.status === IncidentStatus.OPEN,
    );

    return hadBlockingIncident && !hasUnresolvedBlocker;
  }
}
