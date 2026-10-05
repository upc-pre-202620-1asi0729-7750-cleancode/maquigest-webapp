import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, forkJoin, Observable, retry, switchMap } from 'rxjs';

import { Equipment } from '../domain/model/equipment.entity';

import { EquipmentCategory } from '../domain/model/equipment-category.entity';

import { InventoryApi } from '../infrastructure/inventory-api';

import { INVENTORY_ACCESS_PORT } from '../infrastructure/inventory-access.port';

@Injectable({
  providedIn: 'root',
})
export class InventoryStore {
  readonly #inventoryApi = inject(InventoryApi);

  readonly #inventoryAccess = inject(INVENTORY_ACCESS_PORT);

  readonly #destroyRef = inject(DestroyRef);

  readonly #equipmentSignal = signal<Equipment[]>([]);

  readonly equipment = this.#equipmentSignal.asReadonly();

  readonly #categoriesSignal = signal<EquipmentCategory[]>([]);

  readonly categories = this.#categoriesSignal.asReadonly();

  readonly equipmentCount = computed(() => this.equipment().length);

  readonly categoryCount = computed(() => this.categories().length);

  readonly #loadingSignal = signal<boolean>(false);

  readonly loading = this.#loadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  readonly #accessDeniedSignal = signal<boolean>(false);

  readonly accessDenied = this.#accessDeniedSignal.asReadonly();

  readonly #saveSucceededSignal = signal<boolean>(false);

  readonly saveSucceeded = this.#saveSucceededSignal.asReadonly();

  constructor() {
    this.#loadCategories();
  }

  canManageInventory(userId: number): Observable<boolean> {
    return this.#inventoryAccess.canManageInventory(userId);
  }

  getCategoryById(id: number): Signal<EquipmentCategory | undefined> {
    return computed(() =>
      id ? this.categories().find((category) => category.id === id) : undefined,
    );
  }

  getEquipmentById(id: number): Signal<Equipment | undefined> {
    return computed(() =>
      id ? this.equipment().find((equipment) => equipment.id === id) : undefined,
    );
  }

  loadEquipment(): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#inventoryApi
      .getEquipment()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (equipment) => {
          this.#equipmentSignal.set(equipment);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to load equipment'));

          this.#loadingSignal.set(false);
        },
      });
  }

  loadMarketplaceEquipment(): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    forkJoin({
      equipment: this.#inventoryApi.getEquipment(),

      activeProviderUserIds: this.#inventoryAccess.getActiveProviderUserIds(),
    })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: ({ equipment, activeProviderUserIds }) => {
          const activeProviderIds = new Set(activeProviderUserIds);

          const marketplaceEquipment = equipment.filter((currentEquipment) =>
            activeProviderIds.has(currentEquipment.userId),
          );

          this.#equipmentSignal.set(marketplaceEquipment);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },

        error: (err) => {
          this.#equipmentSignal.set([]);

          this.#errorSignal.set(this.#formatError(err, 'Failed to load marketplace equipment'));

          this.#loadingSignal.set(false);
        },
      });
  }

  loadEquipmentById(id: number): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#inventoryApi
      .getEquipmentById(id)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (equipment) => {
          equipment = this.#assignCategoryToEquipment(equipment);

          this.#equipmentSignal.update((equipmentCollection) => {
            const exists = equipmentCollection.some(
              (currentEquipment) => currentEquipment.id === equipment.id,
            );

            if (exists) {
              return equipmentCollection.map((currentEquipment) =>
                currentEquipment.id === equipment.id ? equipment : currentEquipment,
              );
            }

            return [...equipmentCollection, equipment];
          });

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to load equipment'));

          this.#loadingSignal.set(false);
        },
      });
  }

  loadEquipmentByUserId(userId: number): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#inventoryApi
      .getEquipmentByUserId(userId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (equipment) => {
          this.#equipmentSignal.set(equipment);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to load equipment'));

          this.#loadingSignal.set(false);
        },
      });
  }

  addEquipment(equipment: Equipment): void {
    this.#prepareSaveOperation();

    this.#inventoryAccess
      .canManageInventory(equipment.userId)
      .pipe(
        switchMap((canManageInventory) => {
          if (!canManageInventory) {
            this.#accessDeniedSignal.set(true);

            this.#loadingSignal.set(false);

            return EMPTY;
          }

          return this.#inventoryApi.createEquipment(equipment).pipe(retry(2));
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (createdEquipment) => {
          createdEquipment = this.#assignCategoryToEquipment(createdEquipment);

          this.#equipmentSignal.update((equipmentCollection) => [
            ...equipmentCollection,
            createdEquipment,
          ]);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);

          this.#accessDeniedSignal.set(false);

          this.#saveSucceededSignal.set(true);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to create equipment'));

          this.#loadingSignal.set(false);

          this.#saveSucceededSignal.set(false);
        },
      });
  }

  updateEquipment(equipment: Equipment): void {
    this.#prepareSaveOperation();

    this.#inventoryAccess
      .canManageInventory(equipment.userId)
      .pipe(
        switchMap((canManageInventory) => {
          if (!canManageInventory) {
            this.#accessDeniedSignal.set(true);

            this.#loadingSignal.set(false);

            return EMPTY;
          }

          return this.#inventoryApi.updateEquipment(equipment).pipe(retry(2));
        }),

        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (updatedEquipment) => {
          updatedEquipment = this.#assignCategoryToEquipment(updatedEquipment);

          this.#equipmentSignal.update((equipmentCollection) =>
            equipmentCollection.map((currentEquipment) =>
              currentEquipment.id === updatedEquipment.id ? updatedEquipment : currentEquipment,
            ),
          );

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);

          this.#accessDeniedSignal.set(false);

          this.#saveSucceededSignal.set(true);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to update equipment'));

          this.#loadingSignal.set(false);

          this.#saveSucceededSignal.set(false);
        },
      });
  }

  clearSaveState(): void {
    this.#accessDeniedSignal.set(false);

    this.#saveSucceededSignal.set(false);
  }

  clearEquipment(): void {
    this.#equipmentSignal.set([]);

    this.#errorSignal.set(null);

    this.#loadingSignal.set(false);
  }

  #prepareSaveOperation(): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#accessDeniedSignal.set(false);

    this.#saveSucceededSignal.set(false);
  }

  #loadCategories(): void {
    this.#loadingSignal.set(true);

    this.#errorSignal.set(null);

    this.#inventoryApi
      .getCategories()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (categories) => {
          this.#categoriesSignal.set(categories);

          this.#loadingSignal.set(false);

          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to load equipment categories'));

          this.#loadingSignal.set(false);
        },
      });
  }

  #assignCategoriesToEquipment(): void {
    this.#equipmentSignal.update((equipmentCollection) =>
      equipmentCollection.map((equipment) => this.#assignCategoryToEquipment(equipment)),
    );
  }

  #assignCategoryToEquipment(equipment: Equipment): Equipment {
    const categoryId = equipment.categoryId ?? 0;

    equipment.category = categoryId ? (this.getCategoryById(categoryId)() ?? null) : null;

    return equipment;
  }

  #formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }

    return fallback;
  }
}
