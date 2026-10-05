import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

import { PlanStatus } from '../domain/model/plan-status.enum';

export interface SubscriptionPlansResponse extends BaseResponse {
  subscriptionPlans: SubscriptionPlanResource[];
}

export interface SubscriptionPlanResource extends BaseResource {
  id: number;
  name: string;
  description: string;
  priceAmount: number;
  priceCurrency: string;
  billingCycle: string;
  status: PlanStatus;
}
