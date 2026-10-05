import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { Money } from '../../shared/domain/value-object/money.value-object';

import { SubscriptionPlan } from '../domain/model/subscription-plan.entity';

import { SubscriptionPlanResource, SubscriptionPlansResponse } from './subscription-plan-response';

export class SubscriptionPlanAssembler implements BaseAssembler<
  SubscriptionPlan,
  SubscriptionPlanResource,
  SubscriptionPlansResponse
> {
  toEntitiesFromResponse(response: SubscriptionPlansResponse): SubscriptionPlan[] {
    return response.subscriptionPlans.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: SubscriptionPlanResource): SubscriptionPlan {
    return new SubscriptionPlan({
      id: resource.id,

      name: resource.name,

      description: resource.description,

      price: new Money({
        amount: resource.priceAmount,

        currency: resource.priceCurrency,
      }),

      billingCycle: resource.billingCycle,

      status: resource.status,
    });
  }

  toResourceFromEntity(entity: SubscriptionPlan): SubscriptionPlanResource {
    return {
      id: entity.id,

      name: entity.name,

      description: entity.description,

      priceAmount: entity.price.amount,

      priceCurrency: entity.price.currency,

      billingCycle: entity.billingCycle,

      status: entity.status,
    };
  }
}
