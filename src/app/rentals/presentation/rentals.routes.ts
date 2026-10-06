import { Routes } from '@angular/router';

import { rentalRequestManagementGuard } from '../infrastructure/rental-request-management.guard';

const rentalRequests = () =>
  import('./views/rental-requests/rental-requests').then((m) => m.RentalRequests);

export const rentalsRoutes: Routes = [
  {
    path: 'requests',

    loadComponent: rentalRequests,

    title: 'MaquiGest - Rental Requests',

    canActivate: [rentalRequestManagementGuard],
  },
  {
    path: '',

    redirectTo: 'requests',

    pathMatch: 'full',
  },
];
