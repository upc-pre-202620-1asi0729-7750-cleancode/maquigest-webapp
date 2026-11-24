import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { RentalNotificationApiEndpoint } from './rental-notification-api-endpoint';
import { RentalNotificationResource } from './rental-notification-response';

describe('RentalNotificationApiEndpoint', () => {
  let endpoint: RentalNotificationApiEndpoint;
  let http: HttpTestingController;
  const url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderRentalNotificationsEndpointPath}`;
  const resource: RentalNotificationResource = {
    id: 8, referenceId: 12, type: 'RENTAL_REQUEST_CREATED', title: 'Rental request received',
    message: 'A rental request was received.', occurredAt: '2026-11-24T17:00:00Z',
    read: false, readAt: null, emailStatus: 'PENDING',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    endpoint = new RentalNotificationApiEndpoint(TestBed.inject(HttpClient));
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('queries the authenticated inbox without a recipient parameter and maps the array', () => {
    endpoint.getAll('es').subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].referenceId).toBe(12);
      expect(items[0].occurredAt.toISOString()).toBe('2026-11-24T17:00:00.000Z');
      expect(items[0].read).toBe(false);
    });
    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Accept-Language')).toBe('es-PE');
    expect(request.request.params.keys()).toEqual([]);
    request.flush([resource]);
  });

  it('loads a single notification in English', () => {
    endpoint.getById(8, 'en').subscribe(item => expect(item.title).toBe(resource.title));
    const request = http.expectOne(`${url}/8`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Accept-Language')).toBe('en');
    request.flush(resource);
  });

  it('marks a notification as read only using the server response', () => {
    endpoint.markAsRead(8, 'en').subscribe(item => {
      expect(item.read).toBe(true);
      expect(item.readAt?.toISOString()).toBe('2026-11-24T17:10:00.000Z');
    });
    const request = http.expectOne(`${url}/8/read`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    request.flush({ ...resource, read: true, readAt: '2026-11-24T17:10:00Z' });
  });
});
