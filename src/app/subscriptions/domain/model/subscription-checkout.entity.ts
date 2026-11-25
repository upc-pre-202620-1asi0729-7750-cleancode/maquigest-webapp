export interface SubscriptionCheckout {
  reference: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  checkoutUrl: string | null;
  subscriptionId: number | null;
}
