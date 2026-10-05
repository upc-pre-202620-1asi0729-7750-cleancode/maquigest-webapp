import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';

import { SubscriptionPlanApiEndpoint } from './subscription-plan-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionsApi extends BaseApi {
  readonly #subscriptionPlanEndpoint = new SubscriptionPlanApiEndpoint(this.http);

  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.#subscriptionPlanEndpoint.getAll();
  }
}
