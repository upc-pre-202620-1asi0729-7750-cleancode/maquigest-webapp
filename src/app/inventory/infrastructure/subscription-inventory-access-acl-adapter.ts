import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { catchError, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import { InventoryAccessPort } from './inventory-access.port';

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
export class SubscriptionInventoryAccessAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements InventoryAccessPort
{
  readonly #http = inject(HttpClient);

  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserSubscriptionsEndpointPath}`;

  canManageInventory(userId: number): Observable<boolean> {
    return this.#getSubscriptions().pipe(
      map((subscriptions) =>
        subscriptions.some(
          (subscription) => subscription.userId === userId && this.#isActive(subscription),
        ),
      ),
    );
  }

  getActiveProviderUserIds(): Observable<number[]> {
    return this.#getSubscriptions().pipe(
      map((subscriptions) => [
        ...new Set(
          subscriptions
            .filter((subscription) => this.#isActive(subscription))
            .map((subscription) => subscription.userId),
        ),
      ]),
    );
  }

  #getSubscriptions(): Observable<ExternalUserSubscriptionResource[]> {
    return this.#http
      .get<ExternalUserSubscriptionResource[]>(this.#endpointUrl)
      .pipe(catchError(this.handleError('Failed to validate inventory access')));
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
