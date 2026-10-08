import { Component, effect, inject, untracked } from '@angular/core';
import { Layout } from './shared/presentation/components/layout/layout';
import { IamStore } from './iam/application/iam.store';
import { InventoryStore } from './inventory/application/inventory.store';
import { RentalsStore } from './rentals/application/rentals.store';
import { IncidentStore } from './maintenance/application/incident.store';
import { MaintenanceStore } from './maintenance/application/maintenance.store';
import { SubscriptionsStore } from './subscriptions/application/subscriptions.store';

/** App composition root; no bounded-context Domain imports or cross-context mutations. */
@Component({
  selector: 'app-root',
  imports: [Layout],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly #iam = inject(IamStore);
  readonly #inventory = inject(InventoryStore);
  readonly #rentals = inject(RentalsStore);
  readonly #incidents = inject(IncidentStore);
  readonly #maintenance = inject(MaintenanceStore);
  readonly #subscriptions = inject(SubscriptionsStore);

  constructor() {
    let priorUserId = this.#iam.currentUserId();
    effect(() => {
      const currentUserId = this.#iam.currentUserId();
      if (currentUserId === priorUserId) return;
      priorUserId = currentUserId;
      untracked(() => {
        this.#inventory.clearEquipment();
        this.#rentals.clearForIdentityChange();
        this.#incidents.clear();
        this.#maintenance.clear();
        this.#subscriptions.clearCurrentSubscription();
      });
    });
  }
}
