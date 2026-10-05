import { Routes } from '@angular/router';

const signIn = () => import('./views/sign-in/sign-in').then((m) => m.SignIn);

const signUp = () => import('./views/sign-up/sign-up').then((m) => m.SignUp);

export const iamRoutes: Routes = [
  {
    path: 'sign-in',
    loadComponent: signIn,
  },
  {
    path: 'sign-up',
    loadComponent: signUp,
  },
];
