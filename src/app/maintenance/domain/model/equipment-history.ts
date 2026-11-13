/** Read-only projection of an equipment's operational history (US26). */
export type EquipmentHistoryKind = 'RENTAL' | 'INCIDENT' | 'MAINTENANCE';

export interface EquipmentHistoryEntry {
  readonly id: number;
  readonly kind: EquipmentHistoryKind;
  readonly occurredAt: Date;
  readonly description: string;
  readonly status: string;
}

export interface EquipmentHistory {
  readonly equipmentId: number;
  readonly equipmentCode: string;
  readonly equipmentName: string;
  readonly entries: readonly EquipmentHistoryEntry[];
}
