import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { EquipmentHistoryApiEndpoint } from './equipment-history-api-endpoint';

describe('EquipmentHistoryApiEndpoint', () => {
  let api: EquipmentHistoryApiEndpoint;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(EquipmentHistoryApiEndpoint);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and orders real history entries from Platform', () => {
    let receivedKinds: string[] = [];
    api.getByEquipmentId(42).subscribe((history) => {
      expect(history.equipmentId).toBe(42);
      expect(history.equipmentCode).toBe('EQ-42');
      receivedKinds = history.entries.map((entry) => entry.kind);
    });

    const request = http.expectOne(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderMaintenancesEndpointPath}/equipment/42/history`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      equipmentId: 42, equipmentCode: 'EQ-42', equipmentName: 'Excavator',
      entries: [
        { id: 1, kind: 'MAINTENANCE', occurredAt: '2026-09-01T09:00:00Z', description: 'Oil change', status: 'COMPLETED' },
        { id: 2, kind: 'RENTAL', occurredAt: '2026-10-01T09:00:00Z', description: 'Rental', status: 'ACTIVE' },
      ],
    });
    expect(receivedKinds).toEqual(['RENTAL', 'MAINTENANCE']);
  });
});
