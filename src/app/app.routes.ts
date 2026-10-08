import { Routes } from '@angular/router';

import { iamGuard } from './iam/infrastructure/iam.guard';

const iamRoutes = () => import('./iam/presentation/iam.routes').then((m) => m.iamRoutes);

const profilesRoutes = () =>
  import('./profiles/presentation/profiles.routes').then((m) => m.profilesRoutes);

const inventoryRoutes = () =>
  import('./inventory/presentation/inventory.routes').then((m) => m.inventoryRoutes);

const rentalsRoutes = () =>
  import('./rentals/presentation/rentals.routes').then((m) => m.rentalsRoutes);

const maintenanceRoutes = () =>
  import('./maintenance/presentation/maintenance.routes').then((m) => m.maintenanceRoutes);

const subscriptionsRoutes = () =>
  import('./subscriptions/presentation/subscriptions.routes').then((m) => m.subscriptionsRoutes);

const dashboard = () =>
  import('./shared/presentation/views/dashboard/dashboard').then((m) => m.Dashboard);

export const routes: Routes = [
  {
    path: 'iam',
    loadChildren: iamRoutes,
  },
  {
    path: 'dashboard',
    loadComponent: dashboard,
    title: 'MaquiGest - Dashboard',
    canActivate: [iamGuard],
  },
  {
    path: 'profiles',
    loadChildren: profilesRoutes,
    canActivate: [iamGuard],
  },
  {
    path: 'inventory',
    loadChildren: inventoryRoutes,
    canActivate: [iamGuard],
  },
  {
    path: 'rentals',
    loadChildren: rentalsRoutes,
    canActivate: [iamGuard],
  },
  {
    path: 'maintenance',
    loadChildren: maintenanceRoutes,
    canActivate: [iamGuard],
  },
  {
    path: 'subscriptions',
    loadChildren: subscriptionsRoutes,
    canActivate: [iamGuard],
  },
  {
    path: '',
    redirectTo: '/iam/sign-in',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/iam/sign-in',
  },
];
