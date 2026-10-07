import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { Delivery } from '../domain/model/delivery.entity';

import { DeliveryAssembler } from './delivery-assembler';

import { DeliveriesResponse, DeliveryResource } from './delivery-response';

export class DeliveryApiEndpoint extends BaseApiEndpoint<
  Delivery,
  DeliveryResource,
  DeliveriesResponse,
  DeliveryAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,

      `${environment.platformProviderApiBaseUrl}${environment.platformProviderDeliveriesEndpointPath}`,

      new DeliveryAssembler(),
    );
  }
}
