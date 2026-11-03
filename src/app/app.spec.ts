
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { App } from './app';

import { IamStore } from './iam/application/iam.store';
import { InventoryStore } from './inventory/application/inventory.store';
import { RentalsStore } from './rentals/application/rentals.store';
import { IncidentStore } from './maintenance/application/incident.store';
import { MaintenanceStore } from './maintenance/application/maintenance.store';
import { SubscriptionsStore } from './subscriptions/application/subscriptions.store';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        {
          provide: IamStore,
          useValue: {
            currentUserId: signal<number | null>(null),
          },
        },
        {
          provide: InventoryStore,
          useValue: {
            clearEquipment: () => {},
          },
        },
        {
          provide: RentalsStore,
          useValue: {
            clearForIdentityChange: () => {},
          },
        },
        {
          provide: IncidentStore,
          useValue: {
            clear: () => {},
          },
        },
        {
          provide: MaintenanceStore,
          useValue: {
            clear: () => {},
          },
        },
        {
          provide: SubscriptionsStore,
          useValue: {
            clearCurrentSubscription: () => {},
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
