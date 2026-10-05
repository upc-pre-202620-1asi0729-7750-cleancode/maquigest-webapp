import { InjectionToken } from '@angular/core';

import { Observable } from 'rxjs';

export interface SubscriptionAccessPort {
  hasActiveSubscription(userId: number): Observable<boolean>;
}

export const SUBSCRIPTION_ACCESS_PORT = new InjectionToken<SubscriptionAccessPort>(
  'SUBSCRIPTION_ACCESS_PORT',
);
