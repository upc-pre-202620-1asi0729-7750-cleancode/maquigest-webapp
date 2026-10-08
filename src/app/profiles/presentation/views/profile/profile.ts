import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatError } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';

import { ProfilesStore } from '../../../application/profiles.store';
import { CompanyProfile } from '../../../domain/model/company-profile.entity';

import { CompanyProfileComponent } from '../../components/company-profile/company-profile';
import { EditProfileComponent } from '../../components/edit-profile/edit-profile';

@Component({
  selector: 'app-profile',
  imports: [
    CompanyProfileComponent,
    EditProfileComponent,
    MatButtonModule,
    MatError,
    MatProgressSpinner,
    TranslatePipe,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  readonly #iamStore = inject(IamStore);
  readonly #profilesStore = inject(ProfilesStore);

  readonly loading = this.#profilesStore.loading;
  readonly error = this.#profilesStore.error;
  readonly profile = this.#profilesStore.profile;

  readonly isEditing = signal(false);

  constructor() {
    effect(() => {
      const userId = this.#iamStore.currentUserId();

      if (userId === null) {
        this.#profilesStore.clearProfile();
        return;
      }

      this.#profilesStore.loadProfileByUserId(userId);
    });
  }

  startEditing(): void {
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

  updateProfile(profile: CompanyProfile): void {
    this.#profilesStore.updateProfile(profile);
    this.isEditing.set(false);
  }
}
