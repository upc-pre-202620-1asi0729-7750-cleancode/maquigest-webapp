import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { Equipment } from '../../../domain/model/equipment.entity';
import { EquipmentStatus } from '../../../domain/model/equipment-status.enum';

type EquipmentAvailability = 'available' | 'reserved' | 'rented' | 'maintenance';

@Component({
  selector: 'app-availability-badge',
  imports: [TranslatePipe],
  templateUrl: './availability-badge.html',
  styleUrl: './availability-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityBadge {
  readonly equipment = input.required<Equipment>();

  readonly availability = computed<EquipmentAvailability>(() => {
    const equipment = this.equipment();

    if (equipment.status === EquipmentStatus.MAINTENANCE) {
      return 'maintenance';
    }

    if (equipment.status === EquipmentStatus.RENTED) {
      return 'rented';
    }

    if (equipment.isReservedOn(new Date())) {
      return 'reserved';
    }

    return 'available';
  });
}
