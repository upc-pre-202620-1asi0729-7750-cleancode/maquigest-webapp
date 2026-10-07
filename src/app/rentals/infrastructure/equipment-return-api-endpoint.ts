import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { EquipmentReturn } from '../domain/model/equipment-return.entity';

import { EquipmentReturnAssembler } from './equipment-return-assembler';

import { EquipmentReturnResource, EquipmentReturnsResponse } from './equipment-return-response';

export class EquipmentReturnApiEndpoint extends BaseApiEndpoint<
  EquipmentReturn,
  EquipmentReturnResource,
  EquipmentReturnsResponse,
  EquipmentReturnAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,

      `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentReturnsEndpointPath}`,

      new EquipmentReturnAssembler(),
    );
  }
}
