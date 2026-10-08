import { Routes } from '@angular/router';

import { maintenanceManagementGuard } from '../infrastructure/maintenance-management.guard';

const maintenanceList = () =>
  import('./views/maintenance-list/maintenance-list').then((m) => m.MaintenanceList);

export const maintenanceRoutes: Routes = [
  {
    path: '',
    loadComponent: maintenanceList,
    title: 'MaquiGest - Maintenance',
    canActivate: [maintenanceManagementGuard],
  },
];
