import { EquipmentHistoryKind } from '../domain/model/equipment-history';

/** Contract expected from the read-only Maintenance endpoint in Platform. */
export interface EquipmentHistoryEntryResource {
  id: number;
  kind: EquipmentHistoryKind;
  occurredAt: string;
  description: string;
  status: string;
}

export interface EquipmentHistoryResource {
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  entries: EquipmentHistoryEntryResource[];
}
