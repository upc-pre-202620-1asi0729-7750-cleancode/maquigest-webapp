import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly store = inject(IamStore);

  protected get dashboardTitle(): string {
    return this.store.currentRole() === 'rental_company'
      ? 'dashboard.rental-title'
      : 'dashboard.construction-title';
  }

  protected get companyType(): string {
    return this.store.currentRole() === 'rental_company'
      ? 'dashboard.rental-company'
      : 'dashboard.construction-company';
  }
}
