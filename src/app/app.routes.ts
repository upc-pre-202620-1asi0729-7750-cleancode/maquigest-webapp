import { Routes } from '@angular/router';

const iamRoutes = () => import('./iam/presentation/iam.routes').then((m) => m.iamRoutes);
const dashboard = () =>
  import('./shared/presentation/views/dashboard/dashboard').then((m) => m.Dashboard);

import { iamGuard } from './iam/infrastructure/iam.guard';

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
    path: '',
    redirectTo: '/iam/sign-in',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/iam/sign-in',
  },
];
