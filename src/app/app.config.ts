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

import { SUBSCRIPTION_ACCESS_PORT } from './rentals/infrastructure/subscription-access.port';
import { SubscriptionAccessAclAdapter } from './rentals/infrastructure/subscription-access-acl-adapter';

import { EQUIPMENT_INFORMATION_PORT } from './rentals/infrastructure/equipment-information.port';
import { InventoryEquipmentInformationAclAdapter } from './rentals/infrastructure/inventory-equipment-information-acl-adapter';

import { PARTICIPANT_INFORMATION_PORT } from './rentals/infrastructure/participant-information.port';
import { ProfilesParticipantInformationAclAdapter } from './rentals/infrastructure/profiles-participant-information-acl-adapter';

import { EQUIPMENT_OPERATION_PORT } from './rentals/infrastructure/equipment-operation.port';
import { InventoryEquipmentOperationAclAdapter } from './rentals/infrastructure/inventory-equipment-operation-acl-adapter';

import { INVENTORY_ACCESS_PORT } from './inventory/infrastructure/inventory-access.port';
import { SubscriptionInventoryAccessAclAdapter } from './inventory/infrastructure/subscription-inventory-access-acl-adapter';

import { MAINTENANCE_EQUIPMENT_INFORMATION_PORT } from './maintenance/infrastructure/equipment-information.port';

import { InventoryEquipmentInformationAclAdapter as MaintenanceInventoryEquipmentInformationAclAdapter } from './maintenance/infrastructure/inventory-equipment-information-acl-adapter';

import { MAINTENANCE_ACCESS_PORT } from './maintenance/infrastructure/maintenance-access.port';

import { SubscriptionMaintenanceAccessAclAdapter } from './maintenance/infrastructure/subscription-maintenance-access-acl-adapter';

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

    {
      provide: SUBSCRIPTION_ACCESS_PORT,
      useClass: SubscriptionAccessAclAdapter,
    },

    {
      provide: EQUIPMENT_INFORMATION_PORT,
      useClass: InventoryEquipmentInformationAclAdapter,
    },

    {
      provide: PARTICIPANT_INFORMATION_PORT,
      useClass: ProfilesParticipantInformationAclAdapter,
    },

    {
      provide: EQUIPMENT_OPERATION_PORT,
      useClass: InventoryEquipmentOperationAclAdapter,
    },

    {
      provide: INVENTORY_ACCESS_PORT,
      useClass: SubscriptionInventoryAccessAclAdapter,
    },

    {
      provide: MAINTENANCE_EQUIPMENT_INFORMATION_PORT,
      useClass: MaintenanceInventoryEquipmentInformationAclAdapter,
    },

    {
      provide: MAINTENANCE_ACCESS_PORT,
      useClass: SubscriptionMaintenanceAccessAclAdapter,
    },
  ],
};
