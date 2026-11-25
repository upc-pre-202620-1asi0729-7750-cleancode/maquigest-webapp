import { provideHttpClient, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { SubscriptionCheckoutApiEndpoint } from './subscription-checkout-api-endpoint';

describe('SubscriptionCheckoutApiEndpoint', () => {
  let api: SubscriptionCheckoutApiEndpoint;
  let http: HttpTestingController;
  const url = `${environment.platformProviderApiBaseUrl}/subscription-checkouts`;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = new SubscriptionCheckoutApiEndpoint(TestBed.inject(HttpClient));
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('sends plan identity only, never amount or active status', () => {
    api.create(1).subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ planId: 1 });
    req.flush({ reference: 'ref', status: 'PENDING', checkoutUrl: null, subscriptionId: null });
  });
  it('reconciles through the server without asserting payment', () => {
    api.confirm('ref').subscribe();
    const req = http.expectOne(`${url}/ref/confirm`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ reference: 'ref', status: 'PAID', checkoutUrl: null, subscriptionId: 1 });
  });
});
