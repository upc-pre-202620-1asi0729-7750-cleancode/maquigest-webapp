import { Routes } from '@angular/router';

const signIn = () => import('./views/sign-in/sign-in').then((m) => m.SignIn);

export const iamRoutes: Routes = [
  {
    path: 'sign-in',
    loadComponent: signIn,
    title: 'MaquiGest - Sign In',
  },
];
