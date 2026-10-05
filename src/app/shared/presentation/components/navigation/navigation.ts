import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, MatButtonModule, TranslatePipe],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation {
  protected readonly store = inject(IamStore);

  protected readonly options = signal([
    {
      link: '/dashboard',
      label: 'navigation.dashboard',
    },
    {
      link: '/inventory/equipment',
      label: 'navigation.equipment',
    },
    {
      link: '/profiles/profile',
      label: 'navigation.profile',
    },
  ]);
}
