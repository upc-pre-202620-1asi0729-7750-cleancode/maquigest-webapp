import { HttpClient } from '@angular/common/http';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';

import { EquipmentCategory } from '../domain/model/equipment-category.entity';

import {
  EquipmentCategoriesResponse,
  EquipmentCategoryResource,
} from './equipment-categories-response';

import { EquipmentCategoryAssembler } from './equipment-category-assembler';

export class EquipmentCategoriesApiEndpoint extends BaseApiEndpoint<
  EquipmentCategory,
  EquipmentCategoryResource,
  EquipmentCategoriesResponse,
  EquipmentCategoryAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentCategoriesEndpointPath}`,
      new EquipmentCategoryAssembler(),
    );
  }
}
