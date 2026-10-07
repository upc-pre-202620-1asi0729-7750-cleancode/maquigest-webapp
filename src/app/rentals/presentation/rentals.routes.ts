import { Routes } from '@angular/router';

import { constructionRentalRequestGuard } from '../infrastructure/construction-rental-request.guard';

import { rentalManagementGuard } from '../infrastructure/rental-management.guard';

import { rentalRequestManagementGuard } from '../infrastructure/rental-request-management.guard';

const rentalRequests = () =>
  import('./views/rental-requests/rental-requests').then((m) => m.RentalRequests);

const activeRentals = () =>
  import('./views/active-rentals/active-rentals').then((m) => m.ActiveRentals);

const myRequests = () => import('./views/my-requests/my-requests').then((m) => m.MyRequests);

const rentalRequestDetail = () =>
  import('./views/rental-request-detail/rental-request-detail').then((m) => m.RentalRequestDetail);

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
    path: 'my-requests',

    loadComponent: myRequests,

    title: 'MaquiGest - My Requests',

    canActivate: [constructionRentalRequestGuard],
  },
  {
    path: 'my-requests/:id',

    loadComponent: rentalRequestDetail,

    title: 'MaquiGest - Request Detail',

    canActivate: [constructionRentalRequestGuard],
  },
  {
    path: '',

    redirectTo: 'requests',

    pathMatch: 'full',
  },
];
