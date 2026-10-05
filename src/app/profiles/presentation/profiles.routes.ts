import { Routes } from '@angular/router';

const profile = () => import('./views/profile/profile').then((m) => m.ProfileComponent);

export const profilesRoutes: Routes = [
  {
    path: 'profile',
    loadComponent: profile,
  },
];
