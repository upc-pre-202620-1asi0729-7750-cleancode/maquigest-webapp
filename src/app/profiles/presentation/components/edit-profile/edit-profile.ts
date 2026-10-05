import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { BaseForm } from '../../../../shared/presentation/components/base-form/base-form';
import { CompanyProfile } from '../../../domain/model/company-profile.entity';
import { Address } from '../../../domain/value-object/address.value-object';

@Component({
  selector: 'app-edit-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfileComponent extends BaseForm {
  readonly profile = input.required<CompanyProfile>();

  readonly profileUpdated = output<CompanyProfile>();

  readonly form = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    contactEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),

    phoneNumber: new FormControl('', {
      nonNullable: true,
    }),

    companyName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    street: new FormControl('', {
      nonNullable: true,
    }),

    district: new FormControl('', {
      nonNullable: true,
    }),

    city: new FormControl('', {
      nonNullable: true,
    }),

    country: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor() {
    super();

    effect(() => {
      const profile = this.profile();

      this.form.patchValue({
        firstName: profile.firstName,
        lastName: profile.lastName,
        contactEmail: profile.contactEmail,
        phoneNumber: profile.phoneNumber,
        companyName: profile.companyName,
        street: profile.address.street,
        district: profile.address.district,
        city: profile.address.city,
        country: profile.address.country,
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const currentProfile = this.profile();

    const updatedProfile = new CompanyProfile({
      id: currentProfile.id,
      userId: currentProfile.userId,

      firstName: this.form.controls.firstName.value,
      lastName: this.form.controls.lastName.value,
      contactEmail: this.form.controls.contactEmail.value,
      phoneNumber: this.form.controls.phoneNumber.value,

      companyName: this.form.controls.companyName.value,

      address: new Address({
        street: this.form.controls.street.value,
        district: this.form.controls.district.value,
        city: this.form.controls.city.value,
        country: this.form.controls.country.value,

        latitude: currentProfile.address.latitude,
        longitude: currentProfile.address.longitude,
      }),
    });

    this.profileUpdated.emit(updatedProfile);
  }
}
