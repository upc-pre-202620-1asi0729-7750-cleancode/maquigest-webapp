import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DateRange } from '../../shared/domain/value-object/date-range.value-object';
import { environment } from '../../../environments/environment';
import { EquipmentApiEndpoint } from './equipment-api-endpoint';

describe('EquipmentApiEndpoint - server availability', () => {
  let endpoint: EquipmentApiEndpoint;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    endpoint = new EquipmentApiEndpoint(TestBed.inject(HttpClient));
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends calendar dates to the backend and uses its unavailable result', () => {
    const period = new DateRange({
      startDate: new Date(2026, 10, 20, 0, 0, 0, 0),
      endDate: new Date(2026, 10, 20, 23, 59, 59, 999),
    });
    let available: boolean | undefined;
    endpoint.getAvailability(3, period).subscribe((value) => { available = value; });

    const request = http.expectOne(
      (item) => item.url === `${environment.platformProviderApiBaseUrl}${environment.platformProviderEquipmentEndpointPath}/3/availability`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('startDate')).toBe('2026-11-20');
    expect(request.request.params.get('endDate')).toBe('2026-11-20');
    request.flush({ equipmentId: 3, startDate: '2026-11-20', endDate: '2026-11-20', available: false });
    expect(available).toBe(false);
  });
});
