import { Routes } from '@angular/router';

import { anonymousGuard } from '../infrastructure/anonymous.guard';

const signIn = () => import('./views/sign-in/sign-in').then((m) => m.SignIn);

const signUp = () => import('./views/sign-up/sign-up').then((m) => m.SignUp);

const recoverPassword = () =>
  import('./views/recover-password/recover-password').then((m) => m.RecoverPassword);

export const iamRoutes: Routes = [
  {
    path: 'sign-in',
    loadComponent: signIn,
    canActivate: [anonymousGuard],
  },
  {
    path: 'recover-password',
    loadComponent: recoverPassword,
    canActivate: [anonymousGuard],
    title: 'MaquiGest - Recover password',
  },
  {
    path: 'sign-up',
    loadComponent: signUp,
    canActivate: [anonymousGuard],
  },
];
