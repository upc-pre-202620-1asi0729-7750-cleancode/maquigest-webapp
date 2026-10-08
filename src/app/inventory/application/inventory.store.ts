import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, forkJoin, map, Observable, retry, switchMap, tap } from 'rxjs';

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
  #pendingOperationCount = 0;

  #beginOperation(): void {
    this.#pendingOperationCount += 1;
    this.#loadingSignal.set(true);
  }

  #finishOperation(): void {
    this.#pendingOperationCount = Math.max(0, this.#pendingOperationCount - 1);
    this.#loadingSignal.set(this.#pendingOperationCount > 0);
  }


  readonly loading = this.#loadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);

  readonly error = this.#errorSignal.asReadonly();

  readonly #accessDeniedSignal = signal<boolean>(false);

  readonly accessDenied = this.#accessDeniedSignal.asReadonly();

  /** Sequence number prevents delayed list responses from changing a newer view. */
  #listRequestVersion = 0;
  #detailRequestVersion = 0;

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

  /** A fresh server read for edit. Presentation never reads Infrastructure directly. */
  getEquipmentForEdit(id: number, ownerUserId: number): Observable<Equipment> {
    return this.#inventoryApi.getEquipmentById(id).pipe(
      map((equipment) => {
        if (equipment.userId !== ownerUserId) {
          throw new Error('Equipment does not belong to the current company');
        }
        return equipment;
      }),
      tap((equipment) => this.#upsertEquipment(equipment)),
    );
  }

  /** Never infer present-day availability from an earlier cached Equipment entity. */
  verifyEquipmentAvailability(id: number, period: import('../../shared/domain/value-object/date-range.value-object').DateRange): Observable<boolean> {
    return this.#inventoryApi.getEquipmentById(id).pipe(
      tap((equipment) => this.#upsertEquipment(equipment)),
      map((equipment) => equipment.isAvailableFor(period)),
    );
  }

  #upsertEquipment(equipment: Equipment): void {
    const refreshed = this.#assignCategoryToEquipment(equipment);
    this.#equipmentSignal.update((list) => {
      const exists = list.some((item) => item.id === refreshed.id);
      return exists
        ? list.map((item) => item.id === refreshed.id ? refreshed : item)
        : [...list, refreshed];
    });
  }

  loadEquipment(): void {
    const requestVersion = ++this.#listRequestVersion;
    this.#beginOperation();

    this.#errorSignal.set(null);

    this.#inventoryApi
      .getEquipment()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (equipment) => {
          if (requestVersion !== this.#listRequestVersion) { this.#finishOperation(); return; }
          this.#equipmentSignal.set(equipment);

          this.#finishOperation();

          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },

        error: (err) => {
          if (requestVersion !== this.#listRequestVersion) { this.#finishOperation(); return; }
          this.#errorSignal.set(this.#formatError(err, 'Failed to load equipment'));

          this.#finishOperation();
        },
      });
  }

  /**
   * Refresca el catálogo activo desde Inventory y el ACL de suscripciones.
   * background=true mantiene las tarjetas visibles durante una actualización en segundo plano.
   */
  loadMarketplaceEquipment(background = false): void {
    const requestVersion = ++this.#listRequestVersion;

    if (!background) {
      this.#beginOperation();
      this.#errorSignal.set(null);
    }

    forkJoin({
      equipment: this.#inventoryApi.getEquipment(),
      activeProviderUserIds: this.#inventoryAccess.getActiveProviderUserIds(),
    })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: ({ equipment, activeProviderUserIds }) => {
          if (requestVersion !== this.#listRequestVersion) {
            if (!background) this.#finishOperation();
            return;
          }

          const activeProviderIds = new Set(activeProviderUserIds);
          const marketplaceEquipment = equipment.filter((currentEquipment) =>
            activeProviderIds.has(currentEquipment.userId),
          );

          this.#equipmentSignal.set(marketplaceEquipment);
          this.#assignCategoriesToEquipment();
          this.#errorSignal.set(null);
          if (!background) this.#finishOperation();
        },
        error: (err) => {
          if (requestVersion !== this.#listRequestVersion) {
            if (!background) this.#finishOperation();
            return;
          }

          // Never present cached cards as if the current server read had succeeded.
          this.#equipmentSignal.set([]);
          this.#errorSignal.set(
            this.#formatError(err, 'Failed to synchronize marketplace equipment'),
          );
          if (!background) this.#finishOperation();
        },
      });
  }

  loadEquipmentById(id: number): void {
    const detailRequestVersion = ++this.#detailRequestVersion;
    this.#beginOperation();

    this.#errorSignal.set(null);

    this.#inventoryApi
      .getEquipmentById(id)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (equipment) => {
          if (detailRequestVersion !== this.#detailRequestVersion) { this.#finishOperation(); return; }
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

          this.#finishOperation();

          this.#errorSignal.set(null);
        },

        error: (err) => {
          if (detailRequestVersion !== this.#detailRequestVersion) { this.#finishOperation(); return; }
          this.#errorSignal.set(this.#formatError(err, 'Failed to load equipment'));

          this.#finishOperation();
        },
      });
  }

  loadEquipmentByUserId(userId: number): void {
    const requestVersion = ++this.#listRequestVersion;
    this.#beginOperation();

    this.#errorSignal.set(null);

    this.#inventoryApi
      .getEquipmentByUserId(userId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (equipment) => {
          if (requestVersion !== this.#listRequestVersion) { this.#finishOperation(); return; }
          this.#equipmentSignal.set(equipment);

          this.#finishOperation();

          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },

        error: (err) => {
          if (requestVersion !== this.#listRequestVersion) { this.#finishOperation(); return; }
          this.#errorSignal.set(this.#formatError(err, 'Failed to load equipment'));

          this.#finishOperation();
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

            this.#finishOperation();

            return EMPTY;
          }

          return this.#inventoryApi.createEquipment(equipment);
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

          this.#finishOperation();

          this.#errorSignal.set(null);

          this.#accessDeniedSignal.set(false);

          this.#saveSucceededSignal.set(true);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to create equipment'));

          this.#finishOperation();

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

            this.#finishOperation();

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

          this.#finishOperation();

          this.#errorSignal.set(null);

          this.#accessDeniedSignal.set(false);

          this.#saveSucceededSignal.set(true);
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to update equipment'));

          this.#finishOperation();

          this.#saveSucceededSignal.set(false);
        },
      });
  }

  clearSaveState(): void {
    this.#accessDeniedSignal.set(false);

    this.#saveSucceededSignal.set(false);
  }

  clearEquipment(): void {
    ++this.#listRequestVersion;
    ++this.#detailRequestVersion;
    this.#equipmentSignal.set([]);

    this.#errorSignal.set(null);

    this.#pendingOperationCount = 0;
    this.#loadingSignal.set(false);
  }

  #prepareSaveOperation(): void {
    this.#beginOperation();

    this.#errorSignal.set(null);

    this.#accessDeniedSignal.set(false);

    this.#saveSucceededSignal.set(false);
  }

  #loadCategories(): void {
    this.#beginOperation();

    this.#errorSignal.set(null);

    this.#inventoryApi
      .getCategories()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (categories) => {
          this.#categoriesSignal.set(categories);

          this.#finishOperation();

          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },

        error: (err) => {
          this.#errorSignal.set(this.#formatError(err, 'Failed to load equipment categories'));

          this.#finishOperation();
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
