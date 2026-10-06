import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { RentalRequest } from '../domain/model/rental-request.entity';

import { RentalRequestApiEndpoint } from './rental-request-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class RentalsApi extends BaseApi {
  readonly #rentalRequestEndpoint = new RentalRequestApiEndpoint(this.http);

  getRentalRequests(): Observable<RentalRequest[]> {
    return this.#rentalRequestEndpoint.getAll();
  }

  createRentalRequest(rentalRequest: RentalRequest): Observable<RentalRequest> {
    return this.#rentalRequestEndpoint.create(rentalRequest);
  }
}
