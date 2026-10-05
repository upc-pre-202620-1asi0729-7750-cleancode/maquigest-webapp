import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { provideTranslateService } from '@ngx-translate/core';

import { App } from './app';

import { SIGN_IN_PORT } from './iam/infrastructure/sign-in.port';
import { FakeSignInApiEndpoint } from './iam/infrastructure/fake-sign-in-api-endpoint';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: SIGN_IN_PORT,
          useClass: FakeSignInApiEndpoint,
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });
});
