import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

import { SubscriptionStatus } from '../domain/model/subscription-status.enum';

export interface UserSubscriptionsResponse extends BaseResponse {
  userSubscriptions: UserSubscriptionResource[];
}

export interface UserSubscriptionResource extends BaseResource {
  id: number;
  userId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
}
