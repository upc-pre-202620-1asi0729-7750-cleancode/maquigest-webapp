import { Routes } from '@angular/router';

import { inventoryManagementGuard } from '../infrastructure/inventory-management.guard';

const equipmentList = () =>
  import('./views/equipment-list/equipment-list').then((m) => m.EquipmentList);

const equipmentForm = () =>
  import('./views/equipment-form/equipment-form').then((m) => m.EquipmentForm);

const equipmentSearch = () =>
  import('./views/equipment-search/equipment-search').then((m) => m.EquipmentSearch);

const equipmentDetail = () =>
  import('./views/equipment-detail/equipment-detail').then((m) => m.EquipmentDetail);

export const inventoryRoutes: Routes = [
  {
    path: 'equipment',

    loadComponent: equipmentList,

    canActivate: [inventoryManagementGuard],
  },

  {
    path: 'equipment/new',

    loadComponent: equipmentForm,

    canActivate: [inventoryManagementGuard],
  },

  {
    path: 'equipment/:id/edit',

    loadComponent: equipmentForm,

    canActivate: [inventoryManagementGuard],
  },

  {
    path: 'equipment/:id',

    loadComponent: equipmentDetail,
  },

  {
    path: 'search',

    loadComponent: equipmentSearch,
  },
];
