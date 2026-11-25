import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { IamStore } from '../application/iam.store';
import { SignInCommand } from '../domain/model/sign-in.command';
import { IamApi } from './iam-api';
import { iamInterceptor } from './iam.interceptor';

describe('IAM session stabilization', () => {
  const url = `${environment.platformProviderApiBaseUrl}/rental-notifications`;
  const authUrl = `${environment.platformProviderApiBaseUrl}/authentication/sign-in`;
  const jwt = (exp: number) => `header.${btoa(JSON.stringify({ exp }))}.signature`;
  const token = () => jwt(Math.floor(Date.now() / 1000) + 3600);
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const signIn = vi.fn();
  let http: HttpClient;
  let testing: HttpTestingController;
  function persist(value: string) {
    localStorage.setItem('token', value);
    localStorage.setItem('userId', '1');
    localStorage.setItem('email', 'test@example.com');
    localStorage.setItem('role', 'rental_company');
    localStorage.setItem('status', 'active');
  }
  beforeEach(() => {
    localStorage.clear(); router.navigate.mockClear(); signIn.mockReset();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([iamInterceptor])), provideHttpClientTesting(),
      { provide: Router, useValue: router }, { provide: IamApi, useValue: { signIn } },
    ] });
    http = TestBed.inject(HttpClient); testing = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { testing.verify(); localStorage.clear(); });
  it('discards expired stored sessions', () => {
    persist(jwt(1));
    expect(TestBed.inject(IamStore).isSignedIn()).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
  it('discards malformed stored tokens', () => {
    persist('invalid');
    expect(TestBed.inject(IamStore).currentToken()).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
  });
  it('clears the current session on a protected 401', () => {
    const value = token(); persist(value);
    const store = TestBed.inject(IamStore);
    http.get(url).subscribe({ error: () => {} });
    const request = testing.expectOne(url);
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${value}`);
    request.flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(store.isSignedIn()).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/iam/sign-in']);
  });
  it('preserves the session on a protected 403', () => {
    persist(token()); const store = TestBed.inject(IamStore);
    http.get(url).subscribe({ error: () => {} });
    testing.expectOne(url).flush(null, { status: 403, statusText: 'Forbidden' });
    expect(store.isSignedIn()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('does not attach a token or clear the session on authentication or third-party requests', () => {
    persist(token()); const store = TestBed.inject(IamStore);
    for (const target of [authUrl, 'https://example.com/resource']) {
      http.get(target).subscribe({ error: () => {} });
      const request = testing.expectOne(target);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush(null, { status: 401, statusText: 'Unauthorized' });
    }
    expect(store.isSignedIn()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('does not clear a newer session when an old request returns 401', () => {
    persist(token()); const store = TestBed.inject(IamStore);
    http.get(url).subscribe({ error: () => {} });
    const oldRequest = testing.expectOne(url);
    const newer = jwt(Math.floor(Date.now() / 1000) + 7200);
    signIn.mockReturnValue(of({ id: 2, email: 'new@example.com', role: 'rental_company', status: 'active', token: newer }));
    store.signIn(new SignInCommand({ email: 'new@example.com', password: 'test' }), TestBed.inject(Router));
    oldRequest.flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(store.currentToken()).toBe(newer);
    expect(store.currentUserId()).toBe(2);
    expect(store.isSignedIn()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalledWith(['/iam/sign-in']);
  });
});
