import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

  getByUserId(userId: number): Observable<CompanyProfile | undefined> {
    const params = new HttpParams().set('userId', userId.toString());

    return this.http.get<ProfilesResponse | ProfileResource[]>(this.endpointUrl, { params }).pipe(
      map((response) => {
        const resources = Array.isArray(response) ? response : response.profiles;

        const resource = resources[0];

        return resource ? this.assembler.toEntityFromResource(resource) : undefined;
      }),
      catchError(this.handleError('Failed to fetch profile by user id')),
    );
  }
}
