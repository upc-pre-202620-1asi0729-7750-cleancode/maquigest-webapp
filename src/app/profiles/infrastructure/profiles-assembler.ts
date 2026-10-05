import { Profile } from '../domain/model/profile.entity';
import { CompanyProfile } from '../domain/model/company-profile.entity';
import { UpdateProfileCommand } from '../domain/model/update-profile.command';
import { Address } from '../domain/value-object/address.value-object';

import { UpdateProfileRequest } from './update-profile.request';
import { ProfileResource } from './profile-response';

export class ProfilesAssembler {
  toRequestFromCommand(command: UpdateProfileCommand): UpdateProfileRequest {
    return {
      firstName: command.firstName,
      lastName: command.lastName,
      contactEmail: command.contactEmail,
      phoneNumber: command.phoneNumber,
      companyName: command.companyName,

      address: {
        street: command.address.street,
        district: command.address.district,
        city: command.address.city,
        country: command.address.country,
        latitude: command.address.latitude,
        longitude: command.address.longitude,
      },
    };
  }

  toProfileFromResource(resource: ProfileResource): Profile {
    return new Profile({
      id: resource.id,
      userId: resource.userId,
      firstName: resource.firstName,
      lastName: resource.lastName,
      contactEmail: resource.contactEmail,
      phoneNumber: resource.phoneNumber,
    });
  }

  toCompanyProfileFromResource(resource: ProfileResource): CompanyProfile {
    const address = new Address({
      street: resource.address.street,
      district: resource.address.district,
      city: resource.address.city,
      country: resource.address.country,
      latitude: resource.address.latitude,
      longitude: resource.address.longitude,
    });

    return new CompanyProfile({
      id: resource.id,
      userId: resource.userId,
      companyName: resource.companyName,
      address,
    });
  }
}
