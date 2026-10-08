import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { forkJoin, map } from 'rxjs';

import { Maintenance } from '../domain/model/maintenance.entity';

import { MaintenanceStatus } from '../domain/model/maintenance-status.enum';

import { MaintenanceApi } from '../infrastructure/maintenance-api';

import {
  MAINTENANCE_EQUIPMENT_INFORMATION_PORT,
  MaintenanceEquipmentInformation,
} from '../infrastructure/equipment-information.port';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceStore {
  readonly #maintenanceApi = inject(MaintenanceApi);

  readonly #equipmentInformation = inject(MAINTENANCE_EQUIPMENT_INFORMATION_PORT);

  readonly #destroyRef = inject(DestroyRef);
  #loadVersion = 0;

  readonly #maintenancesSignal = signal<Maintenance[]>([]);

  readonly maintenances = this.#maintenancesSignal.asReadonly();

  readonly #equipmentInformationSignal = signal<MaintenanceEquipmentInformation[]>([]);

  readonly equipmentInformation = this.#equipmentInformationSignal.asReadonly();

  readonly #loadingSignal = signal<boolean>(false);

  readonly loading = this.#loadingSignal.asReadonly();

  readonly #savingSignal = signal<boolean>(false);

  readonly saving = this.#savingSignal.asReadonly();

  readonly #saveSucceededSignal = signal<boolean>(false);

  readonly saveSucceeded = this.#saveSucceededSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  loadForCompany(userId: number): void {
    const version = ++this.#loadVersion;
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    forkJoin({
      equipmentInformation: this.#equipmentInformation.getEquipmentInformationByUserId(userId),

      maintenances: this.#maintenanceApi.getMaintenances(),
    })
      .pipe(
        map(({ equipmentInformation, maintenances }) => {
          const equipmentIds = new Set(equipmentInformation.map((equipment) => equipment.id));

          return {
            equipmentInformation,

            maintenances: maintenances
              .filter((maintenance) => equipmentIds.has(maintenance.equipmentId))
              .sort(
                (firstMaintenance, secondMaintenance) =>
                  secondMaintenance.performedAt.getTime() - firstMaintenance.performedAt.getTime(),
              ),
          };
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: ({ equipmentInformation, maintenances }) => {
          if (version !== this.#loadVersion) return;
          this.#equipmentInformationSignal.set(equipmentInformation);

          this.#maintenancesSignal.set(maintenances);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);
        },

        error: (error) => {
          if (version !== this.#loadVersion) return;
          this.#equipmentInformationSignal.set([]);

          this.#maintenancesSignal.set([]);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(this.#formatError(error, 'Failed to load maintenance records'));
        },
      });
  }

  // US23 - Register completed maintenance
  registerMaintenance(userId: number, equipmentId: number, performedAt: Date, type: string): void {
    this.#saveSucceededSignal.set(false);

    this.#errorSignal.set(null);

    const equipment = this.#equipmentInformationSignal().find(
      (currentEquipment) =>
        currentEquipment.id === equipmentId && currentEquipment.ownerUserId === userId,
    );

    if (!equipment) {
      this.#errorSignal.set('The selected equipment does not exist for this company');

      return;
    }

    let maintenance: Maintenance;

    try {
      maintenance = new Maintenance({
        id: 0,
        equipmentId,
        performedAt,
        type,
        status: MaintenanceStatus.COMPLETED,
      });
    } catch (error) {
      this.#errorSignal.set(this.#formatError(error, 'Invalid maintenance information'));

      return;
    }

    this.#savingSignal.set(true);

    this.#maintenanceApi
      .createMaintenance(maintenance)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (createdMaintenance) => {
          this.#maintenancesSignal.update((maintenances) => [createdMaintenance, ...maintenances]);

          this.#savingSignal.set(false);

          this.#saveSucceededSignal.set(true);

          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.#savingSignal.set(false);

          this.#saveSucceededSignal.set(false);

          this.#errorSignal.set(this.#formatError(error, 'Failed to register maintenance'));
        },
      });
  }

  // US24 - Schedule pending maintenance
  scheduleMaintenance(userId: number, equipmentId: number, scheduledAt: Date, type: string): void {
    this.#saveSucceededSignal.set(false);

    this.#errorSignal.set(null);

    const equipment = this.#equipmentInformationSignal().find(
      (currentEquipment) =>
        currentEquipment.id === equipmentId && currentEquipment.ownerUserId === userId,
    );

    if (!equipment) {
      this.#errorSignal.set('The selected equipment does not exist for this company');

      return;
    }

    let maintenance: Maintenance;

    try {
      maintenance = Maintenance.schedule({
        id: 0,
        equipmentId,
        scheduledAt,
        type,
      });
    } catch (error) {
      this.#errorSignal.set(this.#formatError(error, 'Invalid scheduled maintenance information'));

      return;
    }

    this.#savingSignal.set(true);

    this.#maintenanceApi
      .createMaintenance(maintenance)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (createdMaintenance) => {
          this.#maintenancesSignal.update((maintenances) => [createdMaintenance, ...maintenances]);

          this.#savingSignal.set(false);

          this.#saveSucceededSignal.set(true);

          this.#errorSignal.set(null);
        },

        error: (error) => {
          this.#savingSignal.set(false);

          this.#saveSucceededSignal.set(false);

          this.#errorSignal.set(this.#formatError(error, 'Failed to schedule maintenance'));
        },
      });
  }

  clearSaveState(): void {
    this.#saveSucceededSignal.set(false);

    this.#errorSignal.set(null);
  }

  clear(): void {
    ++this.#loadVersion;
    this.#maintenancesSignal.set([]);

    this.#equipmentInformationSignal.set([]);

    this.#loadingSignal.set(false);

    this.#savingSignal.set(false);

    this.#saveSucceededSignal.set(false);

    this.#errorSignal.set(null);
  }

  getEquipmentInformation(equipmentId: number): MaintenanceEquipmentInformation | undefined {
    return this.#equipmentInformationSignal().find((equipment) => equipment.id === equipmentId);
  }

  #formatError(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  }
}
