import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PasswordRecoveryCommand } from '../domain/model/password-recovery.command';
import { PasswordRecoveryApiEndpoint } from './password-recovery-api-endpoint';

describe('PasswordRecoveryApiEndpoint', () => {
  let endpoint: PasswordRecoveryApiEndpoint;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    endpoint = TestBed.inject(PasswordRecoveryApiEndpoint);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the recovery command to the Platform REST API', () => {
    let completed = false;
    endpoint.requestRecovery(new PasswordRecoveryCommand('test@example.com')).subscribe({
      next: () => { completed = true; },
    });

    const request = httpTesting.expectOne(
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderPasswordRecoveryEndpointPath}`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'test@example.com' });
    request.flush(null);
    expect(completed).toBe(true);
  });
});
