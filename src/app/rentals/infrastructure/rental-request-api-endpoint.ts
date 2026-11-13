import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { DateRange } from '../../shared/domain/value-object/date-range.value-object';

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

  /** Separate operation: PUT /{id} remains reserved for the rental company's decision. */
  reschedulePending(id: number, period: DateRange): Observable<RentalRequest> {
    return this.http.patch<RentalRequestResource>(`${this.endpointUrl}/${id}/period`, {
      startDate: period.startDate.toISOString(),
      endDate: period.endDate.toISOString(),
    }).pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }
}
