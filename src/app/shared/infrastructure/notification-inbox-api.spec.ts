import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { NotificationInboxApi } from './notification-inbox-api';
import { notificationKey, sortNotifications } from '../application/models/notification-inbox-item';

const paths = ['/iam-notifications', '/profile-notifications', '/inventory-notifications',
  '/rental-notifications', '/maintenance-notifications', '/subscriptions-notifications'];
const url = (path: string) => `${environment.platformProviderApiBaseUrl}${path}`;
const resource = { id: 7, referenceId: 12, type: 'ACCOUNT_REGISTERED', title: 'Title', message: 'Message',
  occurredAt: '2026-11-24T17:00:00Z', read: false, readAt: null, emailStatus: 'NOT_REQUIRED' };

describe('NotificationInboxApi', () => {
  let api: NotificationInboxApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(NotificationInboxApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('queries the six real endpoints with the requested locale and no recipient parameter', () => {
    let count = 0;
    api.getNotifications('es').subscribe(results => {
      const items = results.flatMap(result => result.items ?? []);
      count = items.length;
      expect(new Set(items.map(notificationKey)).size).toBe(6);
      expect(items.every(item => item.occurredAt instanceof Date)).toBe(true);
    });
    for (const path of paths) {
      const request = http.expectOne(url(path));
      expect(request.request.method).toBe('GET');
      expect(request.request.headers.get('Accept-Language')).toBe('es-PE');
      expect(request.request.params.keys()).toEqual([]);
      request.flush([resource]);
    }
    expect(count).toBe(6);
  });

  it('preserves the other five sources when one source fails', () => {
    let count = 0;
    api.getNotifications('en').subscribe(results => {
      expect(results.find(result => result.source === 'maintenance')?.items).toBeNull();
      count = results.flatMap(result => result.items ?? []).length;
    });
    for (const path of paths) {
      const request = http.expectOne(url(path));
      expect(request.request.headers.get('Accept-Language')).toBe('en');
      if (path === '/maintenance-notifications') request.flush('Unavailable', { status: 503, statusText: 'Unavailable' });
      else request.flush([resource]);
    }
    expect(count).toBe(5);
  });

  it('marks only the selected context and uses the server response', () => {
    for (const [source, path] of [['profiles', '/profile-notifications'], ['rentals', '/rental-notifications'], ['subscriptions', '/subscriptions-notifications']] as const) {
      let read = false;
      api.markAsRead(source, 7, 'en').subscribe(item => {
        expect(notificationKey(item)).toBe(`${source}:7`);
        expect(item.readAt?.toISOString()).toBe('2026-11-24T17:10:00.000Z');
        read = item.read;
      });
      const request = http.expectOne(url(`${path}/7/read`));
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toBeNull();
      request.flush({ ...resource, read: true, readAt: '2026-11-24T17:10:00Z' });
      expect(read).toBe(true);
    }
  });

  it('sorts notifications across contexts newest first without merging equal ids', () => {
    const first = { ...resource, source: 'iam' as const, occurredAt: new Date('2026-11-24T17:00:00Z') };
    const second = { ...first, source: 'inventory' as const, occurredAt: new Date('2026-11-24T18:00:00Z') };
    expect(sortNotifications([first, second]).map(notificationKey)).toEqual(['inventory:7', 'iam:7']);
  });
});
