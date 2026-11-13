import { EquipmentHistory, EquipmentHistoryKind } from '../domain/model/equipment-history';
import { EquipmentHistoryResource } from './equipment-history-response';

const historyKinds: readonly EquipmentHistoryKind[] = ['RENTAL', 'INCIDENT', 'MAINTENANCE'];

export class EquipmentHistoryAssembler {
  toEntity(resource: EquipmentHistoryResource): EquipmentHistory {
    if (!resource || !Number.isInteger(resource.equipmentId) || resource.equipmentId <= 0 ||
        typeof resource.equipmentCode !== 'string' ||
        typeof resource.equipmentName !== 'string' || !Array.isArray(resource.entries)) {
      throw new Error('Invalid equipment history response');
    }

    const entries = resource.entries.map((entry) => {
      if (!entry || !Number.isInteger(entry.id) || entry.id <= 0 ||
          !historyKinds.includes(entry.kind) ||
          typeof entry.description !== 'string' ||
          typeof entry.status !== 'string' ||
          typeof entry.occurredAt !== 'string') {
        throw new Error('Invalid equipment history entry');
      }

      const occurredAt = new Date(entry.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) {
        throw new Error('Invalid equipment history date');
      }

      return {
        id: entry.id,
        kind: entry.kind,
        occurredAt,
        description: entry.description,
        status: entry.status,
      };
    });

    return {
      equipmentId: resource.equipmentId,
      equipmentCode: resource.equipmentCode,
      equipmentName: resource.equipmentName,
      entries: entries.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()),
    };
  }
}
