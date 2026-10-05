import { HttpClient } from '@angular/common/http';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';

import { CompanyProfile } from '../domain/model/company-profile.entity';
import { ProfileResource, ProfilesResponse } from './profile-response';
import { ProfilesAssembler } from './profiles-assembler';

export class ProfilesApiEndpoint extends BaseApiEndpoint<
  CompanyProfile,
  ProfileResource,
  ProfilesResponse,
  ProfilesAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderProfilesEndpointPath}`,
      new ProfilesAssembler(),
    );
  }
}
