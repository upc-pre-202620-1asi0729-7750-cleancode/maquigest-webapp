import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';

import { UserSubscription } from '../domain/model/user-subscription.entity';

import { UserSubscriptionResource, UserSubscriptionsResponse } from './user-subscription-response';

import { UserSubscriptionAssembler } from './user-subscription-assembler';

export class UserSubscriptionApiEndpoint extends BaseApiEndpoint<
  UserSubscription,
  UserSubscriptionResource,
  UserSubscriptionsResponse,
  UserSubscriptionAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserSubscriptionsEndpointPath}`,
      new UserSubscriptionAssembler(),
    );
  }
}
