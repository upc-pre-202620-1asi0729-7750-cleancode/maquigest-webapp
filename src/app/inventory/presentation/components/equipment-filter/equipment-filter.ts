import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentCategory } from '../../../domain/model/equipment-category.entity';

export type EquipmentAvailabilityFilter =
  'ALL' | 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'MAINTENANCE';

export interface EquipmentFilterCriteria {
  query: string;
  categoryId: number | null;
  location: string;
  availability: EquipmentAvailabilityFilter;
}

@Component({
  selector: 'app-equipment-filter',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './equipment-filter.html',
  styleUrl: './equipment-filter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentFilter {
  readonly categories = input.required<EquipmentCategory[]>();

  readonly filtersChanged = output<EquipmentFilterCriteria>();

  readonly form = new FormGroup({
    query: new FormControl('', {
      nonNullable: true,
    }),

    categoryId: new FormControl<number | null>(null),

    location: new FormControl('', {
      nonNullable: true,
    }),

    availability: new FormControl<EquipmentAvailabilityFilter>('ALL', {
      nonNullable: true,
    }),
  });

  applyFilters(): void {
    const { query, categoryId, location, availability } = this.form.getRawValue();

    this.filtersChanged.emit({
      query: query.trim(),
      categoryId,
      location: location.trim(),
      availability,
    });
  }

  clearFilters(): void {
    this.form.reset({
      query: '',
      categoryId: null,
      location: '',
      availability: 'ALL',
    });

    this.applyFilters();
  }
}
