import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { TranslatePipe } from '@ngx-translate/core';

import { CompanyProfile } from '../../../domain/model/company-profile.entity';

@Component({
  selector: 'app-company-profile',
  imports: [MatCardModule, TranslatePipe],
  templateUrl: './company-profile.html',
  styleUrl: './company-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfileComponent {
  readonly profile = input.required<CompanyProfile>();
}
