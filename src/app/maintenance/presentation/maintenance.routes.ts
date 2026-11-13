import { Routes } from '@angular/router';

import { maintenanceManagementGuard } from '../infrastructure/maintenance-management.guard';
import { maintenanceHistoryGuard } from '../infrastructure/maintenance-history.guard';

const maintenanceList = () =>
  import('./views/maintenance-list/maintenance-list').then((m) => m.MaintenanceList);

const incidentList = () =>
  import('./views/incident-list/incident-list').then((m) => m.IncidentList);

const equipmentHistory = () =>
  import('./views/equipment-history/equipment-history').then((m) => m.EquipmentHistoryView);

export const maintenanceRoutes: Routes = [
  {
    path: 'equipment/:equipmentId/history',
    loadComponent: equipmentHistory,
    title: 'MaquiGest - Equipment History',
    canActivate: [maintenanceHistoryGuard],
  },
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
