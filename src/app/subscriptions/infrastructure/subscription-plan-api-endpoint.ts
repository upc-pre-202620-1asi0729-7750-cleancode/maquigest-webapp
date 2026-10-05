import { HttpClient } from '@angular/common/http';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { environment } from '../../../environments/environment';

import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';

import { SubscriptionPlanResource, SubscriptionPlansResponse } from './subscription-plan-response';

import { SubscriptionPlanAssembler } from './subscription-plan-assembler';

export class SubscriptionPlanApiEndpoint extends BaseApiEndpoint<
  SubscriptionPlan,
  SubscriptionPlanResource,
  SubscriptionPlansResponse,
  SubscriptionPlanAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSubscriptionPlansEndpointPath}`,
      new SubscriptionPlanAssembler(),
    );
  }
}
