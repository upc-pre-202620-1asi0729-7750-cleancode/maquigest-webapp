import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { Delivery } from '../domain/model/delivery.entity';

import { EquipmentReturn } from '../domain/model/equipment-return.entity';

import { Rental } from '../domain/model/rental.entity';

import { RentalRequest } from '../domain/model/rental-request.entity';

import { DeliveryApiEndpoint } from './delivery-api-endpoint';

import { EquipmentReturnApiEndpoint } from './equipment-return-api-endpoint';

import { RentalApiEndpoint } from './rental-api-endpoint';

import { RentalRequestApiEndpoint } from './rental-request-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class RentalsApi extends BaseApi {
  readonly #rentalRequestEndpoint = new RentalRequestApiEndpoint(this.http);

  readonly #rentalEndpoint = new RentalApiEndpoint(this.http);

  readonly #deliveryEndpoint = new DeliveryApiEndpoint(this.http);

  readonly #equipmentReturnEndpoint = new EquipmentReturnApiEndpoint(this.http);

  getRentalRequests(): Observable<RentalRequest[]> {
    return this.#rentalRequestEndpoint.getAll();
  }

  getRentalRequest(id: number): Observable<RentalRequest> {
    return this.#rentalRequestEndpoint.getById(id);
  }

  createRentalRequest(rentalRequest: RentalRequest): Observable<RentalRequest> {
    return this.#rentalRequestEndpoint.create(rentalRequest);
  }

  updateRentalRequest(rentalRequest: RentalRequest): Observable<RentalRequest> {
    return this.#rentalRequestEndpoint.update(rentalRequest, rentalRequest.id);
  }

  getRentals(): Observable<Rental[]> {
    return this.#rentalEndpoint.getAll();
  }

  getRental(id: number): Observable<Rental> {
    return this.#rentalEndpoint.getById(id);
  }

  createRental(rental: Rental): Observable<Rental> {
    return this.#rentalEndpoint.create(rental);
  }

  updateRental(rental: Rental): Observable<Rental> {
    return this.#rentalEndpoint.update(rental, rental.id);
  }

  createDelivery(delivery: Delivery): Observable<Delivery> {
    return this.#deliveryEndpoint.create(delivery);
  }

  createEquipmentReturn(equipmentReturn: EquipmentReturn): Observable<EquipmentReturn> {
    return this.#equipmentReturnEndpoint.create(equipmentReturn);
  }
}
