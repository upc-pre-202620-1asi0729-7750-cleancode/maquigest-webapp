import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import { provideRouter } from '@angular/router';

import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';

import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

import { SIGN_IN_PORT } from './iam/infrastructure/sign-in.port';
import { SignInApiEndpoint } from './iam/infrastructure/sign-in-api-endpoint';
import { FakeSignInApiEndpoint } from './iam/infrastructure/fake-sign-in-api-endpoint';

import { iamInterceptor } from './iam/infrastructure/iam.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideHttpClient(withXhr(), withInterceptors([iamInterceptor])),

    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
    }),

    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      translate.addLangs(['en', 'es']);
      return translate.use('en');
    }),

    provideRouter(routes),

    {
      provide: SIGN_IN_PORT,
      useClass: environment.production ? SignInApiEndpoint : FakeSignInApiEndpoint,
    },
  ],
};
