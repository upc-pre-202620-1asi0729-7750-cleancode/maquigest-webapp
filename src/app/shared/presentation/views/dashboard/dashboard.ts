import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe, MatButtonModule],
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

  protected performSignOut(): void {
    this.store.signOut();
  }
}
