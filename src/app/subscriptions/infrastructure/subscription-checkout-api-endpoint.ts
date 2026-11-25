import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SubscriptionCheckout } from '../domain/model/subscription-checkout.entity';

export class SubscriptionCheckoutApiEndpoint {
  private readonly url = `${environment.platformProviderApiBaseUrl}/subscription-checkouts`;
  constructor(private readonly http: HttpClient) {}
  create(planId: number) {
    return this.http.post<SubscriptionCheckout>(this.url, { planId });
  }
  confirm(reference: string) {
    return this.http.post<SubscriptionCheckout>(`${this.url}/${encodeURIComponent(reference)}/confirm`, {});
  }
}
