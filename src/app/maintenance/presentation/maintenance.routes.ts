import { Routes } from '@angular/router';

import { maintenanceManagementGuard } from '../infrastructure/maintenance-management.guard';

const maintenanceList = () =>
  import('./views/maintenance-list/maintenance-list').then((m) => m.MaintenanceList);

const incidentList = () =>
  import('./views/incident-list/incident-list').then((m) => m.IncidentList);

export const maintenanceRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: maintenanceList,
    title: 'MaquiGest - Maintenance',
    canActivate: [maintenanceManagementGuard],
  },
  {
    path: 'incidents',
    loadComponent: incidentList,
    title: 'MaquiGest - Equipment Incidents',
    canActivate: [maintenanceManagementGuard],
  },
];
