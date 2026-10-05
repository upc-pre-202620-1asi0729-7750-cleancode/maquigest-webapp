import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { Equipment } from '../domain/model/equipment.entity';
import { EquipmentCategory } from '../domain/model/equipment-category.entity';

import { EquipmentApiEndpoint } from './equipment-api-endpoint';
import { EquipmentCategoriesApiEndpoint } from './equipment-categories-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class InventoryApi extends BaseApi {
  readonly #equipmentEndpoint = new EquipmentApiEndpoint(this.http);

  readonly #categoriesEndpoint = new EquipmentCategoriesApiEndpoint(this.http);

  getEquipment(): Observable<Equipment[]> {
    return this.#equipmentEndpoint.getAll();
  }

  getEquipmentByUserId(userId: number): Observable<Equipment[]> {
    return this.#equipmentEndpoint.getByUserId(userId);
  }

  getEquipmentById(id: number): Observable<Equipment> {
    return this.#equipmentEndpoint.getById(id);
  }

  createEquipment(equipment: Equipment): Observable<Equipment> {
    return this.#equipmentEndpoint.create(equipment);
  }

  updateEquipment(equipment: Equipment): Observable<Equipment> {
    return this.#equipmentEndpoint.update(equipment, equipment.id);
  }

  deleteEquipment(id: number): Observable<void> {
    return this.#equipmentEndpoint.delete(id);
  }

  getCategories(): Observable<EquipmentCategory[]> {
    return this.#categoriesEndpoint.getAll();
  }
}
