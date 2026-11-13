import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentHistoryStore } from '../../../application/equipment-history.store';
import { EquipmentHistoryKind } from '../../../domain/model/equipment-history';

@Component({
  selector: 'app-equipment-history',
  imports: [DatePipe, RouterLink, TranslatePipe],
  templateUrl: './equipment-history.html',
  styleUrl: './equipment-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentHistoryView {
  protected readonly store = inject(EquipmentHistoryStore);
  readonly #route = inject(ActivatedRoute);
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    this.#route.paramMap
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((params) => {
        const rawId = params.get('equipmentId');
        const equipmentId = rawId !== null && /^\d+$/.test(rawId) ? Number(rawId) : NaN;
        this.store.load(equipmentId);
      });
  }

  protected kindKey(kind: EquipmentHistoryKind): string {
    return `maintenance.history.kind.${kind.toLowerCase()}`;
  }

  protected statusKey(status: string): string | null {
    switch (status) {
      case 'CONFIRMED':
      case 'ACTIVE':
      case 'COMPLETED':
      case 'SCHEDULED':
      case 'IN_PROGRESS':
      case 'OPEN':
      case 'RESOLVED':
        return `maintenance.history.status.${status.toLowerCase()}`;
      default:
        return null;
    }
  }
}
