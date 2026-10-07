import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { Rental } from '../domain/model/rental.entity';

import { RentalRequest } from '../domain/model/rental-request.entity';

import { RentalApiEndpoint } from './rental-api-endpoint';

import { RentalRequestApiEndpoint } from './rental-request-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class RentalsApi extends BaseApi {
  readonly #rentalRequestEndpoint = new RentalRequestApiEndpoint(this.http);

  readonly #rentalEndpoint = new RentalApiEndpoint(this.http);

  getRentalRequests(): Observable<RentalRequest[]> {
    return this.#rentalRequestEndpoint.getAll();
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
}
