import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { catchError, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import { MaintenanceAccessPort } from './maintenance-access.port';

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
export class SubscriptionMaintenanceAccessAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements MaintenanceAccessPort
{
  readonly #http = inject(HttpClient);

  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderUserSubscriptionsEndpointPath}`;

  canRegisterMaintenance(userId: number): Observable<boolean> {
    return this.#http.get<ExternalUserSubscriptionResource[]>(this.#endpointUrl).pipe(
      map((subscriptions) =>
        subscriptions.some(
          (subscription) =>
            subscription.userId === userId &&
            subscription.planId === 3 &&
            subscription.status === 'ACTIVE' &&
            this.#isWithinPeriod(subscription.startDate, subscription.endDate),
        ),
      ),

      catchError(this.handleError('Failed to verify maintenance subscription access')),
    );
  }

  #isWithinPeriod(start: string, end: string): boolean {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return false;
    }

    const now = new Date();

    return startDate <= now && now <= endDate;
  }
}
