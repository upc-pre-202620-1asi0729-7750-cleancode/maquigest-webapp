import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';

import { UserSubscription } from '../domain/model/user-subscription.entity';

import { SubscriptionPlanApiEndpoint } from './subscription-plan-api-endpoint';

import { UserSubscriptionApiEndpoint } from './user-subscription-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionsApi extends BaseApi {
  readonly #subscriptionPlanEndpoint = new SubscriptionPlanApiEndpoint(this.http);

  readonly #userSubscriptionEndpoint = new UserSubscriptionApiEndpoint(this.http);

  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.#subscriptionPlanEndpoint.getAll();
  }

  getUserSubscriptions(): Observable<UserSubscription[]> {
    return this.#userSubscriptionEndpoint.getAll();
  }

  createUserSubscription(subscription: UserSubscription): Observable<UserSubscription> {
    return this.#userSubscriptionEndpoint.create(subscription);
  }

  updateUserSubscription(subscription: UserSubscription): Observable<UserSubscription> {
    return this.#userSubscriptionEndpoint.update(subscription, subscription.id);
  }
}
