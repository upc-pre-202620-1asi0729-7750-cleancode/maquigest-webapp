import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MaintenanceStatus } from '../domain/model/maintenance-status.enum';
import { MaintenanceApi } from './maintenance-api';

describe('MaintenanceApi lifecycle contract', () => {
  let api: MaintenanceApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MaintenanceApi, provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MaintenanceApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses PATCH for an existing maintenance id instead of creating a second record', () => {
    let resultId: number | undefined;
    let resultStatus: MaintenanceStatus | undefined;

    api.advanceMaintenance(42, MaintenanceStatus.COMPLETED, 'Técnico de prueba', 'Inspección completada')
      .subscribe((record) => {
        resultId = record.id;
        resultStatus = record.status;
      });

    const url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderMaintenancesEndpointPath}/42`;
    const request = http.expectOne(url);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      status: MaintenanceStatus.COMPLETED,
      technician: 'Técnico de prueba',
      acknowledge: false,
      notes: 'Inspección completada',
    });
    request.flush({
      id: 42,
      equipmentId: 5,
      performedAt: '2026-11-11T18:00:00Z',
      type: 'Inspección de maquinaria',
      status: MaintenanceStatus.COMPLETED,
    });
    expect(resultId).toBe(42);
    expect(resultStatus).toBe(MaintenanceStatus.COMPLETED);
  });
});
