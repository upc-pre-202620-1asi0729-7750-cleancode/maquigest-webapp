import { BaseAssembler } from '../../shared/infrastructure/base-assembler';

import { CompanyProfile } from '../domain/model/company-profile.entity';
import { Address } from '../domain/value-object/address.value-object';

import { ProfileResource, ProfilesResponse } from './profile-response';

export class ProfilesAssembler implements BaseAssembler<
  CompanyProfile,
  ProfileResource,
  ProfilesResponse
> {
  toEntitiesFromResponse(response: ProfilesResponse): CompanyProfile[] {
    return response.profiles.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: ProfileResource): CompanyProfile {
    return new CompanyProfile({
      id: resource.id,
      userId: resource.userId,
      firstName: resource.firstName,
      lastName: resource.lastName,
      contactEmail: resource.contactEmail,
      phoneNumber: resource.phoneNumber,
      companyName: resource.companyName,

      address: new Address({
        street: resource.address.street,
        district: resource.address.district,
        city: resource.address.city,
        country: resource.address.country,
        latitude: resource.address.latitude,
        longitude: resource.address.longitude,
      }),
    });
  }

  toResourceFromEntity(entity: CompanyProfile): ProfileResource {
    return {
      id: entity.id,
      userId: entity.userId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      contactEmail: entity.contactEmail,
      phoneNumber: entity.phoneNumber,
      companyName: entity.companyName,

      address: {
        street: entity.address.street,
        district: entity.address.district,
        city: entity.address.city,
        country: entity.address.country,
        latitude: entity.address.latitude,
        longitude: entity.address.longitude,
      },
    } as ProfileResource;
  }
}
