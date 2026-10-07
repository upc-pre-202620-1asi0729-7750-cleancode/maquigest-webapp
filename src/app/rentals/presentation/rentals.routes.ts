import { Routes } from '@angular/router';

import { rentalManagementGuard } from '../infrastructure/rental-management.guard';

import { rentalRequestManagementGuard } from '../infrastructure/rental-request-management.guard';

const rentalRequests = () =>
  import('./views/rental-requests/rental-requests').then((m) => m.RentalRequests);

const activeRentals = () =>
  import('./views/active-rentals/active-rentals').then((m) => m.ActiveRentals);

export const rentalsRoutes: Routes = [
  {
    path: 'requests',

    loadComponent: rentalRequests,

    title: 'MaquiGest - Rental Requests',

    canActivate: [rentalRequestManagementGuard],
  },
  {
    path: 'active',

    loadComponent: activeRentals,

    title: 'MaquiGest - Rentals',

    canActivate: [rentalManagementGuard],
  },
  {
    path: '',

    redirectTo: 'requests',

    pathMatch: 'full',
  },
];
