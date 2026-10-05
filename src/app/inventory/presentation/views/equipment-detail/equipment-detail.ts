import { DecimalPipe } from '@angular/common';

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatError } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { InventoryStore } from '../../../application/inventory.store';

import { AvailabilityBadge } from '../../components/availability-badge/availability-badge';

@Component({
  selector: 'app-equipment-detail',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatError,
    MatProgressSpinner,
    TranslatePipe,
    AvailabilityBadge,
  ],
  templateUrl: './equipment-detail.html',
  styleUrl: './equipment-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentDetail {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);

  readonly store = inject(InventoryStore);

  readonly equipmentId = Number(this.#route.snapshot.paramMap.get('id'));

  readonly equipment = computed(() =>
    this.store.equipment().find((equipment) => equipment.id === this.equipmentId),
  );

  constructor() {
    if (Number.isInteger(this.equipmentId) && this.equipmentId > 0) {
      this.store.loadEquipmentById(this.equipmentId);
    }
  }

  backToSearch(): void {
    this.#router.navigate(['/inventory/search']).then();
  }
}
