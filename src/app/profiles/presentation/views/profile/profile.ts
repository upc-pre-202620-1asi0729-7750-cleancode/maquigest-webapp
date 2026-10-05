import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { ProfilesStore } from '../../../application/profiles.store';
import { CompanyProfile } from '../../../domain/model/company-profile.entity';

import { CompanyProfileComponent } from '../../components/company-profile/company-profile';

import { EditProfileComponent } from '../../components/edit-profile/edit-profile';

import { MatButtonModule } from '@angular/material/button';
import { MatError } from '@angular/material/form-field';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profile',
  imports: [
    CompanyProfileComponent,
    EditProfileComponent,
    MatButtonModule,
    MatError,
    MatProgressSpinner,
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

  readonly isEditing = signal(false);

  readonly profile = computed(() => {
    const userId = this.#iamStore.currentUserId();

    if (userId === null) {
      return undefined;
    }

    return this.#profilesStore.profiles().find((profile) => profile.userId === userId);
  });

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
