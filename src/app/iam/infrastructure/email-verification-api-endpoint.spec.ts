import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmailVerificationApiEndpoint } from './email-verification-api-endpoint';
import { VerifyEmailCommand } from '../domain/model/verify-email.command';
import { environment } from '../../../environments/environment';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
describe('EmailVerificationApiEndpoint', () => {
  let api: EmailVerificationApiEndpoint; let http: HttpTestingController;
  const base = environment.platformProviderApiBaseUrl.replace(/\/+$/, '') + '/authentication';
  beforeEach(()=>{ TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});api=TestBed.inject(EmailVerificationApiEndpoint);http=TestBed.inject(HttpTestingController);});
  afterEach(()=>http.verify());
  it('posts verification credentials in the body',()=>{api.verify(new VerifyEmailCommand('a'.repeat(43),'TestPassword!')).subscribe();const req=http.expectOne(base+'/verify-email');expect(req.request.method).toBe('POST');expect(req.request.body).toEqual({token:'a'.repeat(43),password:'TestPassword!'});req.flush(null,{status:204,statusText:'No Content'});});
  it('resends with email only',()=>{api.resend('test@example.com').subscribe();const req=http.expectOne(base+'/resend-email-verification');expect(req.request.method).toBe('POST');expect(req.request.body).toEqual({email:'test@example.com'});req.flush(null,{status:202,statusText:'Accepted'});});
});
