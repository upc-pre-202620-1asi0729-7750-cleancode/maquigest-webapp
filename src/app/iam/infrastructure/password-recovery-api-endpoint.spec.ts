import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PasswordRecoveryCommand } from '../domain/model/password-recovery.command';
import { ResetPasswordCommand } from '../domain/model/reset-password.command';
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

  it('posts the reset command without putting secrets in the URL', () => {
    endpoint.resetPassword(new ResetPasswordCommand('a'.repeat(43), 'NewPassword123!')).subscribe();
    const request = httpTesting.expectOne(`${environment.platformProviderApiBaseUrl}/authentication/reset-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'a'.repeat(43), password: 'NewPassword123!' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

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
