import { HttpClient } from '@angular/common/http';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { environment } from '../../../environments/environment';

import { RentalRequest } from '../domain/model/rental-request.entity';

import { RentalRequestResource, RentalRequestsResponse } from './rental-request-response';

import { RentalRequestAssembler } from './rental-request-assembler';

export class RentalRequestApiEndpoint extends BaseApiEndpoint<
  RentalRequest,
  RentalRequestResource,
  RentalRequestsResponse,
  RentalRequestAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderRentalRequestsEndpointPath}`,
      new RentalRequestAssembler(),
    );
  }
}
