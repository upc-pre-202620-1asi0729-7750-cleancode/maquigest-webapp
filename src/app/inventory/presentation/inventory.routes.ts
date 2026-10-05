import { Routes } from '@angular/router';

const equipmentList = () =>
  import('./views/equipment-list/equipment-list').then((m) => m.EquipmentList);

const equipmentForm = () =>
  import('./views/equipment-form/equipment-form').then((m) => m.EquipmentForm);

export const inventoryRoutes: Routes = [
  {
    path: 'equipment',
    loadComponent: equipmentList,
  },
  {
    path: 'equipment/new',
    loadComponent: equipmentForm,
  },
];
