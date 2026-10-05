import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { DateRange } from '../../shared/domain/value-object/date-range.value-object';

import { UserSubscription } from '../domain/model/user-subscription.entity';

import { UserSubscriptionResource, UserSubscriptionsResponse } from './user-subscription-response';

export class UserSubscriptionAssembler implements BaseAssembler<
  UserSubscription,
  UserSubscriptionResource,
  UserSubscriptionsResponse
> {
  toEntitiesFromResponse(response: UserSubscriptionsResponse): UserSubscription[] {
    return response.userSubscriptions.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: UserSubscriptionResource): UserSubscription {
    return new UserSubscription({
      id: resource.id,
      userId: resource.userId,
      planId: resource.planId,

      period: new DateRange({
        startDate: new Date(resource.startDate),

        endDate: new Date(resource.endDate),
      }),

      status: resource.status,
      autoRenew: resource.autoRenew,
    });
  }

  toResourceFromEntity(entity: UserSubscription): UserSubscriptionResource {
    return {
      id: entity.id,
      userId: entity.userId,
      planId: entity.planId,

      startDate: entity.period.startDate.toISOString(),

      endDate: entity.period.endDate.toISOString(),

      status: entity.status,
      autoRenew: entity.autoRenew,
    };
  }
}
