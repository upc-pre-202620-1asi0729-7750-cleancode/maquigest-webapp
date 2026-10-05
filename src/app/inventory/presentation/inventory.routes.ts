import { Routes } from '@angular/router';

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
  },
  {
    path: 'equipment/new',
    loadComponent: equipmentForm,
  },
  {
    path: 'equipment/:id/edit',
    loadComponent: equipmentForm,
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
