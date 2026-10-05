import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { catchError, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import { SubscriptionAccessPort } from './subscription-access.port';

interface ExternalUserSubscriptionResource {
  id: number;
  userId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
}

@Injectable()
export class SubscriptionAccessAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements SubscriptionAccessPort
{
  readonly #http = inject(HttpClient);

  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserSubscriptionsEndpointPath}`;

  hasActiveSubscription(userId: number): Observable<boolean> {
    return this.#http.get<ExternalUserSubscriptionResource[]>(this.#endpointUrl).pipe(
      map((subscriptions) =>
        subscriptions.some(
          (subscription) => subscription.userId === userId && this.#isActive(subscription),
        ),
      ),

      catchError(this.handleError('Failed to validate subscription access')),
    );
  }

  #isActive(subscription: ExternalUserSubscriptionResource): boolean {
    if (subscription.status !== 'ACTIVE') {
      return false;
    }

    const now = new Date();

    const startDate = new Date(subscription.startDate);

    const endDate = new Date(subscription.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return false;
    }

    return startDate <= now && now <= endDate;
  }
}
