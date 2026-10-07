import { HttpClient } from '@angular/common/http';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { environment } from '../../../environments/environment';

import { Rental } from '../domain/model/rental.entity';

import { RentalResource, RentalsResponse } from './rental-response';

import { RentalAssembler } from './rental-assembler';

export class RentalApiEndpoint extends BaseApiEndpoint<
  Rental,
  RentalResource,
  RentalsResponse,
  RentalAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,

      `${environment.platformProviderApiBaseUrl}${environment.platformProviderRentalsEndpointPath}`,

      new RentalAssembler(),
    );
  }
}
