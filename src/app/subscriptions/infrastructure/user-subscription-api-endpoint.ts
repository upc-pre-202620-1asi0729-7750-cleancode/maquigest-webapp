import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';

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
  cancel(id: number): Observable<UserSubscription> {
    return this.http.patch<UserSubscriptionResource>(`${this.endpointUrl}/${id}/cancel`, {}).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to cancel subscription')),
    );
  }
}
