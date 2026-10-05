import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  Signal,
  signal,
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs';

import { Equipment } from '../domain/model/equipment.entity';
import { EquipmentCategory } from '../domain/model/equipment-category.entity';
import { InventoryApi } from '../infrastructure/inventory-api';

@Injectable({
  providedIn: 'root',
})
export class InventoryStore {

  readonly #inventoryApi = inject(InventoryApi);
  readonly #destroyRef = inject(DestroyRef);

  readonly #equipmentSignal = signal<Equipment[]>([]);
  readonly equipment = this.#equipmentSignal.asReadonly();

  readonly #categoriesSignal = signal<EquipmentCategory[]>([]);
  readonly categories = this.#categoriesSignal.asReadonly();

  readonly equipmentCount = computed(
    () => this.equipment().length,
  );

  readonly categoryCount = computed(
    () => this.categories().length,
  );

  readonly #loadingSignal = signal<boolean>(false);
  readonly loading = this.#loadingSignal.asReadonly();

  readonly #errorSignal = signal<string | null>(null);
  readonly error = this.#errorSignal.asReadonly();

  constructor() {
    this.#loadCategories();
  }

  getCategoryById(
    id: number,
  ): Signal<EquipmentCategory | undefined> {
    return computed(() =>
      id
        ? this.categories().find(
          (category) => category.id === id,
        )
        : undefined,
    );
  }

  getEquipmentById(
    id: number,
  ): Signal<Equipment | undefined> {
    return computed(() =>
      id
        ? this.equipment().find(
          (equipment) => equipment.id === id,
        )
        : undefined,
    );
  }

  loadEquipment(): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#inventoryApi
      .getEquipment()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (equipment) => {
          this.#equipmentSignal.set(equipment);
          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },
        error: (err) => {
          this.#errorSignal.set(
            this.#formatError(
              err,
              'Failed to load equipment',
            ),
          );

          this.#loadingSignal.set(false);
        },
      });
  }

  loadEquipmentByUserId(userId: number): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#inventoryApi
      .getEquipmentByUserId(userId)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (equipment) => {
          this.#equipmentSignal.set(equipment);
          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },
        error: (err) => {
          this.#errorSignal.set(
            this.#formatError(
              err,
              'Failed to load equipment',
            ),
          );
          this.#loadingSignal.set(false);
        },
      });
  }

  addEquipment(equipment: Equipment): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#inventoryApi
      .createEquipment(equipment)
      .pipe(
        retry(2),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (createdEquipment) => {
          createdEquipment =
            this.#assignCategoryToEquipment(
              createdEquipment,
            );

          this.#equipmentSignal.update(
            (equipmentCollection) => [
              ...equipmentCollection,
              createdEquipment,
            ],
          );

          this.#loadingSignal.set(false);
        },
        error: (err) => {
          this.#errorSignal.set(
            this.#formatError(
              err,
              'Failed to create equipment',
            ),
          );
          this.#loadingSignal.set(false);
        },
      });
  }

  updateEquipment(equipment: Equipment): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#inventoryApi
      .updateEquipment(equipment)
      .pipe(
        retry(2),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (updatedEquipment) => {
          updatedEquipment =
            this.#assignCategoryToEquipment(
              updatedEquipment,
            );

          this.#equipmentSignal.update(
            (equipmentCollection) =>
              equipmentCollection.map(
                (currentEquipment) =>
                  currentEquipment.id === updatedEquipment.id
                    ? updatedEquipment
                    : currentEquipment,
              ),
          );

          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);
        },
        error: (err) => {
          this.#errorSignal.set(
            this.#formatError(
              err,
              'Failed to update equipment',
            ),
          );
          this.#loadingSignal.set(false);
        },
      });
  }

  clearEquipment(): void {
    this.#equipmentSignal.set([]);
    this.#errorSignal.set(null);
    this.#loadingSignal.set(false);
  }

  #loadCategories(): void {
    this.#loadingSignal.set(true);
    this.#errorSignal.set(null);

    this.#inventoryApi
      .getCategories()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe({
        next: (categories) => {
          this.#categoriesSignal.set(categories);
          this.#loadingSignal.set(false);
          this.#errorSignal.set(null);

          this.#assignCategoriesToEquipment();
        },
        error: (err) => {
          this.#errorSignal.set(
            this.#formatError(
              err,
              'Failed to load equipment categories',
            ),
          );
          this.#loadingSignal.set(false);
        },
      });
  }

  #assignCategoriesToEquipment(): void {
    this.#equipmentSignal.update(
      (equipmentCollection) =>
        equipmentCollection.map(
          (equipment) =>
            this.#assignCategoryToEquipment(equipment),
        ),
    );
  }

  #assignCategoryToEquipment(
    equipment: Equipment,
  ): Equipment {
    const categoryId = equipment.categoryId ?? 0;

    equipment.category = categoryId
      ? this.getCategoryById(categoryId)() ?? null
      : null;

    return equipment;
  }

  #formatError(
    error: unknown,
    fallback: string,
  ): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }

    return fallback;
  }
}
