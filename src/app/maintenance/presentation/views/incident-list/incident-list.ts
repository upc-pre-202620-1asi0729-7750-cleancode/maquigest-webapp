import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { IncidentStore } from '../../../application/incident.store';
import { Incident } from '../../../domain/model/incident.entity';
import { IncidentStatus } from '../../../domain/model/incident-status.enum';

import {
  IncidentForm,
  IncidentFormValue,
} from '../../components/incident-form/incident-form';

@Component({
  selector: 'app-incident-list',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    IncidentForm,
  ],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentList {
  readonly store = inject(IncidentStore);
  readonly #iamStore = inject(IamStore);

  protected readonly incidentStatus = IncidentStatus;
  protected readonly formOpen = signal(false);
  protected readonly confirmingIncidentId = signal<number | null>(null);
  protected readonly confirmingRestrictionId = signal<number | null>(null);
  protected readonly confirmingReactivationEquipmentId = signal<number | null>(null);
  protected readonly inspectionConfirmed = signal(false);

  protected readonly busy = computed(
    () =>
      this.store.loading() ||
      this.store.saving() ||
      this.store.resolvingIncidentId() !== null ||
      this.store.restrictingIncidentId() !== null ||
      this.store.reactivatingEquipmentId() !== null,
  );

  protected readonly affectedEquipmentCount = computed(
    () =>
      new Set(this.store.incidents().map((incident) => incident.equipmentId))
        .size,
  );

  protected readonly lastIncident = computed(
    () => this.store.incidents()[0] ?? null,
  );

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      if (userId === null) {
        this.store.clear();
        return;
      }

      this.store.loadForCompany(userId);
    });

    effect(() => {
      if (this.store.saveSucceeded()) {
        this.formOpen.set(false);
      }
    });

    effect(() => {
      if (this.store.resolveSucceeded()) {
        this.confirmingIncidentId.set(null);
      }
    });

    effect(() => {
      if (this.store.restrictionSucceeded()) {
        this.confirmingRestrictionId.set(null);
      }
    });

    effect(() => {
      if (this.store.reactivationSucceeded()) {
        this.confirmingReactivationEquipmentId.set(null);
        this.inspectionConfirmed.set(false);
      }
    });
  }

  protected equipmentName(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.name ?? `#${equipmentId}`;
  }

  protected equipmentCode(equipmentId: number): string {
    return this.store.getEquipmentInformation(equipmentId)?.code ?? '-';
  }

  protected openForm(): void {
    if (this.busy() || this.store.equipmentInformation().length === 0) {
      return;
    }

    this.store.clearSaveState();
    this.confirmingIncidentId.set(null);
    this.confirmingRestrictionId.set(null);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    if (this.store.saving()) {
      return;
    }

    this.formOpen.set(false);
    this.store.clearSaveState();
  }

  protected submitForm(value: IncidentFormValue): void {
    const userId = this.#iamStore.currentUserId();

    if (userId === null || this.busy()) {
      return;
    }

    this.store.registerIncident(
      userId,
      value.equipmentId,
      value.description,
      value.blocksRental,
    );
  }

  protected requestResolve(incident: Incident): void {
    if (incident.status !== IncidentStatus.OPEN || this.busy()) {
      return;
    }

    this.store.clearSaveState();
    this.confirmingRestrictionId.set(null);
    this.confirmingIncidentId.set(incident.id);
  }

  protected cancelResolve(): void {
    if (this.store.resolvingIncidentId() === null) {
      this.confirmingIncidentId.set(null);
    }
  }

  protected confirmResolve(incident: Incident): void {
    const userId = this.#iamStore.currentUserId();

    if (
      userId === null ||
      this.busy() ||
      this.confirmingIncidentId() !== incident.id ||
      incident.status !== IncidentStatus.OPEN
    ) {
      return;
    }

    this.store.resolveIncident(userId, incident.id);
  }

  protected requestRestriction(incident: Incident): void {
    if (
      this.busy() ||
      incident.status !== IncidentStatus.OPEN ||
      incident.blocksRental
    ) {
      return;
    }

    this.store.clearSaveState();
    this.confirmingIncidentId.set(null);
    this.confirmingRestrictionId.set(incident.id);
  }

  protected cancelRestriction(): void {
    if (this.store.restrictingIncidentId() === null) {
      this.confirmingRestrictionId.set(null);
    }
  }

  protected requestReactivation(equipmentId: number): void {
    if (
      this.busy() ||
      !this.store.reactivatableEquipment().some((equipment) => equipment.id === equipmentId)
    ) {
      return;
    }
    this.store.clearSaveState();
    this.confirmingIncidentId.set(null);
    this.confirmingRestrictionId.set(null);
    this.confirmingReactivationEquipmentId.set(equipmentId);
    this.inspectionConfirmed.set(false);
  }

  protected cancelReactivation(): void {
    if (this.store.reactivatingEquipmentId() !== null) return;
    this.confirmingReactivationEquipmentId.set(null);
    this.inspectionConfirmed.set(false);
  }

  protected confirmReactivation(equipmentId: number): void {
    const userId = this.#iamStore.currentUserId();
    if (
      userId === null ||
      this.busy() ||
      this.confirmingReactivationEquipmentId() !== equipmentId ||
      !this.inspectionConfirmed()
    ) {
      return;
    }
    this.store.reactivateEquipment(userId, equipmentId, true);
  }

  protected confirmRestriction(incident: Incident): void {
    const userId = this.#iamStore.currentUserId();

    if (
      userId === null ||
      this.busy() ||
      this.confirmingRestrictionId() !== incident.id ||
      incident.status !== IncidentStatus.OPEN ||
      incident.blocksRental
    ) {
      return;
    }

    this.store.requireRentalRestriction(userId, incident.id);
  }
}
