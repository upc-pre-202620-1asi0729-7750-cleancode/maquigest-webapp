import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { forkJoin, map } from 'rxjs';

import { Incident } from '../domain/model/incident.entity';
import { IncidentStatus } from '../domain/model/incident-status.enum';
import { IncidentReactivationPolicy } from '../domain/model/incident-reactivation-policy';
import { IncidentApi } from '../infrastructure/incident-api';

import {
  MAINTENANCE_EQUIPMENT_INFORMATION_PORT,
  MaintenanceEquipmentInformation,
} from '../infrastructure/equipment-information.port';

@Injectable({
  providedIn: 'root',
})
export class IncidentStore {
  readonly #incidentApi = inject(IncidentApi);
  readonly #equipmentInformation = inject(MAINTENANCE_EQUIPMENT_INFORMATION_PORT);
  readonly #destroyRef = inject(DestroyRef);
  #loadVersion = 0;

  readonly #incidentsSignal = signal<Incident[]>([]);
  readonly incidents = this.#incidentsSignal.asReadonly();

  readonly #equipmentInformationSignal = signal<MaintenanceEquipmentInformation[]>([]);
  readonly equipmentInformation = this.#equipmentInformationSignal.asReadonly();

  readonly #loadingSignal = signal(false);
  readonly loading = this.#loadingSignal.asReadonly();

  readonly #savingSignal = signal(false);
  readonly saving = this.#savingSignal.asReadonly();

  readonly #saveSucceededSignal = signal(false);
  readonly saveSucceeded = this.#saveSucceededSignal.asReadonly();

  readonly #resolvingIncidentIdSignal = signal<number | null>(null);
  readonly resolvingIncidentId = this.#resolvingIncidentIdSignal.asReadonly();

  readonly #resolveSucceededSignal = signal(false);
  readonly resolveSucceeded = this.#resolveSucceededSignal.asReadonly();

  readonly #restrictingIncidentIdSignal = signal<number | null>(null);
  readonly restrictingIncidentId = this.#restrictingIncidentIdSignal.asReadonly();

  readonly #restrictionSucceededSignal = signal(false);
  readonly restrictionSucceeded = this.#restrictionSucceededSignal.asReadonly();

  readonly #reactivatingEquipmentIdSignal = signal<number | null>(null);
  readonly reactivatingEquipmentId = this.#reactivatingEquipmentIdSignal.asReadonly();

  readonly #reactivationSucceededSignal = signal(false);
  readonly reactivationSucceeded = this.#reactivationSucceededSignal.asReadonly();

  readonly reactivatableEquipment = computed(() =>
    this.#equipmentInformationSignal().filter(
      (equipment) =>
        equipment.status === 'MAINTENANCE' &&
        IncidentReactivationPolicy.canReactivate(
          equipment.id,
          this.#incidentsSignal(),
        ),
    ),
  );

  // Candidates are displayed for a REQUEST, never treated as automatically eligible.
  // Spring Boot remains the authority for maintenance, incidents and Rentals ACL evidence.
  readonly reactivationCandidates = computed(() =>
    this.#equipmentInformationSignal().filter(equipment =>
      equipment.status === 'MAINTENANCE' &&
      !this.#incidentsSignal().some(incident =>
        incident.equipmentId === equipment.id &&
        incident.blocksRental && incident.status === IncidentStatus.OPEN,
      ),
    ),
  );

  readonly #errorSignal = signal<string | null>(null);
  readonly error = this.#errorSignal.asReadonly();

  loadForCompany(userId: number): void {
    const loadVersion = ++this.#loadVersion;
    this.#loadingSignal.set(true);
    this.#saveSucceededSignal.set(false);
    this.#resolveSucceededSignal.set(false);
    this.#restrictionSucceededSignal.set(false);
    this.#reactivationSucceededSignal.set(false);
    this.#errorSignal.set(null);

    forkJoin({
      equipmentInformation: this.#equipmentInformation.getEquipmentInformationByUserId(userId),
      incidents: this.#incidentApi.getIncidents(),
    })
      .pipe(
        map(({ equipmentInformation, incidents }) => {
          const companyEquipment = equipmentInformation.filter(
            (equipment) => equipment.ownerUserId === userId,
          );
          const equipmentIds = new Set(
            companyEquipment.map((equipment) => equipment.id),
          );

          return {
            equipmentInformation: companyEquipment,
            incidents: incidents
              .filter((incident) => equipmentIds.has(incident.equipmentId))
              .sort(
                (first, second) =>
                  second.reportedAt.getTime() - first.reportedAt.getTime(),
              ),
          };
        }),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: ({ equipmentInformation, incidents }) => {
          if (loadVersion !== this.#loadVersion) return;
          this.#equipmentInformationSignal.set(equipmentInformation);
          this.#incidentsSignal.set(incidents);
          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);
        },
        error: (error) => {
          if (loadVersion !== this.#loadVersion) return;
          this.#equipmentInformationSignal.set([]);
          this.#incidentsSignal.set([]);
          this.#loadingSignal.set(false);
          this.#errorSignal.set(
            this.#formatError(error, 'Failed to load incident records'),
          );
        },
      });
  }

  registerIncident(
    userId: number,
    equipmentId: number,
    description: string,
    blocksRental: boolean = false,
  ): void {
    if (
      this.#savingSignal() ||
      this.#resolvingIncidentIdSignal() !== null ||
      this.#restrictingIncidentIdSignal() !== null
    ) {
      return;
    }

    this.#saveSucceededSignal.set(false);
    this.#resolveSucceededSignal.set(false);
    this.#restrictionSucceededSignal.set(false);
    this.#errorSignal.set(null);

    const equipment = this.#equipmentInformationSignal().find(
      (item) => item.id === equipmentId && item.ownerUserId === userId,
    );

    if (!equipment) {
      this.#errorSignal.set(
        'The selected equipment does not belong to this company',
      );
      return;
    }

    let incident: Incident;

    try {
      incident = Incident.report({ equipmentId, description, blocksRental });
    } catch (error) {
      this.#errorSignal.set(
        this.#formatError(error, 'Invalid incident information'),
      );
      return;
    }

    // Spring Boot owns the incident creation and any required Inventory status change.
    // Do not PATCH Inventory separately from the browser.
    this.#savingSignal.set(true);

    this.#incidentApi.createIncident(incident)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (createdIncident) => {
          this.#incidentsSignal.update((incidents) =>
            [createdIncident, ...incidents].sort(
              (first, second) =>
                second.reportedAt.getTime() - first.reportedAt.getTime(),
            ),
          );
          if (blocksRental) this.#markEquipmentInMaintenance(equipmentId);
          this.#savingSignal.set(false);
          this.#saveSucceededSignal.set(true);
          this.#errorSignal.set(null);
        },
        error: (error) => {
          this.#savingSignal.set(false);
          this.#saveSucceededSignal.set(false);
          this.#errorSignal.set(
            this.#formatError(error, 'Failed to register incident'),
          );
        },
      });
  }

  resolveIncident(userId: number, incidentId: number): void {
    if (
      this.#savingSignal() ||
      this.#resolvingIncidentIdSignal() !== null ||
      this.#restrictingIncidentIdSignal() !== null
    ) {
      return;
    }

    this.#saveSucceededSignal.set(false);
    this.#resolveSucceededSignal.set(false);
    this.#restrictionSucceededSignal.set(false);
    this.#errorSignal.set(null);

    const originalIncident = this.#incidentsSignal().find(
      (incident) => incident.id === incidentId,
    );

    if (!originalIncident || originalIncident.status !== IncidentStatus.OPEN) {
      this.#errorSignal.set('Incident is missing or already resolved');
      return;
    }

    const ownsEquipment = this.#equipmentInformationSignal().some(
      (equipment) =>
        equipment.id === originalIncident.equipmentId &&
        equipment.ownerUserId === userId,
    );

    if (!ownsEquipment) {
      this.#errorSignal.set('Incident does not belong to this company');
      return;
    }

    let resolvedIncident: Incident;

    try {
      resolvedIncident = new Incident({
        id: originalIncident.id,
        equipmentId: originalIncident.equipmentId,
        description: originalIncident.description,
        reportedAt: originalIncident.reportedAt,
        blocksRental: originalIncident.blocksRental,
        status: originalIncident.status,
        resolvedAt: originalIncident.resolvedAt,
      });
      resolvedIncident.resolve();
    } catch (error) {
      this.#errorSignal.set(
        this.#formatError(error, 'Could not resolve incident'),
      );
      return;
    }

    this.#resolvingIncidentIdSignal.set(incidentId);

    this.#incidentApi.resolveIncident(resolvedIncident)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (persistedIncident) => {
          this.#incidentsSignal.update((incidents) =>
            incidents.map((incident) =>
              incident.id === persistedIncident.id ? persistedIncident : incident,
            ),
          );
          this.#resolvingIncidentIdSignal.set(null);
          this.#resolveSucceededSignal.set(true);
          this.#errorSignal.set(null);
        },
        error: (error) => {
          this.#resolvingIncidentIdSignal.set(null);
          this.#resolveSucceededSignal.set(false);
          this.#errorSignal.set(
            this.#formatError(error, 'Failed to resolve incident'),
          );
        },
      });
  }

  requireRentalRestriction(userId: number, incidentId: number): void {
    if (
      this.#loadingSignal() ||
      this.#savingSignal() ||
      this.#resolvingIncidentIdSignal() !== null ||
      this.#restrictingIncidentIdSignal() !== null
    ) {
      return;
    }

    this.#saveSucceededSignal.set(false);
    this.#resolveSucceededSignal.set(false);
    this.#restrictionSucceededSignal.set(false);
    this.#errorSignal.set(null);

    const current = this.#incidentsSignal().find(
      (incident) => incident.id === incidentId,
    );

    if (
      !current ||
      current.status !== IncidentStatus.OPEN ||
      current.blocksRental
    ) {
      this.#errorSignal.set('Only open incidents without a rental restriction can be updated');
      return;
    }

    const belongsToCompany = this.#equipmentInformationSignal().some(
      (equipment) =>
        equipment.id === current.equipmentId &&
        equipment.ownerUserId === userId,
    );

    if (!belongsToCompany) {
      this.#errorSignal.set('Incident does not belong to this company');
      return;
    }

    let updated: Incident;

    try {
      updated = new Incident({
        id: current.id,
        equipmentId: current.equipmentId,
        description: current.description,
        reportedAt: current.reportedAt,
        blocksRental: current.blocksRental,
        status: current.status,
        resolvedAt: current.resolvedAt,
      });
      updated.requireRentalRestriction();
    } catch (error) {
      this.#errorSignal.set(
        this.#formatError(error, 'Cannot update this incident'),
      );
      return;
    }

    // The backend updates the incident and its operational restriction atomically.
    this.#restrictingIncidentIdSignal.set(incidentId);

    this.#incidentApi.requireRentalRestriction(updated)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (persisted) => {
          this.#incidentsSignal.update((incidents) =>
            incidents.map((incident) =>
              incident.id === persisted.id ? persisted : incident,
            ),
          );
          this.#markEquipmentInMaintenance(current.equipmentId);
          this.#restrictingIncidentIdSignal.set(null);
          this.#restrictionSucceededSignal.set(true);
          this.#errorSignal.set(null);
        },
        error: (error) => {
          this.#restrictingIncidentIdSignal.set(null);
          this.#restrictionSucceededSignal.set(false);
          this.#errorSignal.set(
            this.#formatError(error, 'Failed to update rental restriction'),
          );
        },
      });
  }

  // Explicit equipment reactivation after inspection and resolution of blocking incidents.
  reactivateEquipment(
    userId: number,
    equipmentId: number,
    inspectionConfirmed: boolean,
  ): void {
    if (
      this.#loadingSignal() ||
      this.#savingSignal() ||
      this.#resolvingIncidentIdSignal() !== null ||
      this.#restrictingIncidentIdSignal() !== null ||
      this.#reactivatingEquipmentIdSignal() !== null
    ) {
      return;
    }

    this.clearSaveState();

    const equipment = this.#equipmentInformationSignal().find(
      (item) => item.id === equipmentId && item.ownerUserId === userId,
    );

    if (!inspectionConfirmed) {
      this.#errorSignal.set('Confirm the technical inspection before reactivating equipment');
      return;
    }

    if (!equipment || equipment.status !== 'MAINTENANCE') {
      this.#errorSignal.set('Only your equipment in MAINTENANCE can be reactivated');
      return;
    }

    if (this.#incidentsSignal().some(incident =>
      incident.equipmentId === equipmentId &&
      incident.blocksRental && incident.status === IncidentStatus.OPEN
    )) {
      this.#errorSignal.set('Unresolved blocking incidents prevent reactivation');
      return;
    }

    this.#reactivatingEquipmentIdSignal.set(equipmentId);

    // The server checks open incidents, active rentals, inspection confirmation,
    // and maintenance transitions before reactivating Inventory.
    this.#incidentApi.reactivateEquipment(equipmentId, inspectionConfirmed)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => {
          this.#equipmentInformationSignal.update((items) =>
            items.map((item) =>
              item.id === equipmentId ? { ...item, status: 'AVAILABLE' as const } : item,
            ),
          );
          this.#reactivatingEquipmentIdSignal.set(null);
          this.#reactivationSucceededSignal.set(true);
          this.#errorSignal.set(null);
        },
        error: (error) => {
          this.#reactivatingEquipmentIdSignal.set(null);
          this.#reactivationSucceededSignal.set(false);
          this.#errorSignal.set(
            this.#formatError(error, 'Failed to reactivate equipment'),
          );
        },
      });
  }

  getEquipmentInformation(
    equipmentId: number,
  ): MaintenanceEquipmentInformation | undefined {
    return this.#equipmentInformationSignal().find(
      (equipment) => equipment.id === equipmentId,
    );
  }

  clearSaveState(): void {
    this.#reactivationSucceededSignal.set(false);
    this.#saveSucceededSignal.set(false);
    this.#resolveSucceededSignal.set(false);
    this.#restrictionSucceededSignal.set(false);
    this.#errorSignal.set(null);
  }

  clear(): void {
    ++this.#loadVersion;
    this.#incidentsSignal.set([]);
    this.#equipmentInformationSignal.set([]);
    this.#loadingSignal.set(false);
    this.#savingSignal.set(false);
    this.#saveSucceededSignal.set(false);
    this.#resolvingIncidentIdSignal.set(null);
    this.#resolveSucceededSignal.set(false);
    this.#restrictingIncidentIdSignal.set(null);
    this.#restrictionSucceededSignal.set(false);
    this.#reactivatingEquipmentIdSignal.set(null);
    this.#reactivationSucceededSignal.set(false);
    this.#errorSignal.set(null);
  }

  #markEquipmentInMaintenance(equipmentId: number): void {
    this.#equipmentInformationSignal.update((items) => items.map((item) =>
      item.id === equipmentId ? { ...item, status: 'MAINTENANCE' as const } : item,
    ));
  }

  #formatError(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallbackMessage;
  }
}
