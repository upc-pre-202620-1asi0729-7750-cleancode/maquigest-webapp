import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RentalLocationApiEndpoint } from './rental-location-api-endpoint';
import { environment } from '../../../environments/environment';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
describe('RentalLocationApiEndpoint', () => {
  let api: RentalLocationApiEndpoint; let http: HttpTestingController;
  const url = `${environment.platformProviderApiBaseUrl}/rentals/7/locations`;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); api = TestBed.inject(RentalLocationApiEndpoint); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('queries backend with address and no Google credential', () => {
    api.lookup(7, 'Av. Lima & Calle 1').subscribe(value => expect(value.placeId).toBe('place'));
    const req = http.expectOne(r => r.url === url); expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual(['address']); expect(req.request.params.get('address')).toBe('Av. Lima & Calle 1');
    req.flush({ formattedAddress: 'Lima', latitude: -12, longitude: -77, placeId: 'place' });
  });
  it('propagates provider unavailability without retrying', () => {
    api.lookup(7, 'Lima').subscribe({ error: err => expect(err.status).toBe(503) });
    http.expectOne(r => r.url === url).flush({ code: 'RENTAL_LOCATION_UNAVAILABLE' }, {status: 503, statusText: 'Service Unavailable'});
  });
});
