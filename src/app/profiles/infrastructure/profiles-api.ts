import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApi } from '../../shared/infrastructure/base-api';

import { CompanyProfile } from '../domain/model/company-profile.entity';
import { ProfilesApiEndpoint } from './profiles-api-endpoint';

@Injectable({
  providedIn: 'root',
})
export class ProfilesApi extends BaseApi {
  readonly #profilesEndpoint = new ProfilesApiEndpoint(this.http);

  getProfiles(): Observable<CompanyProfile[]> {
    return this.#profilesEndpoint.getAll();
  }

  getProfile(id: number): Observable<CompanyProfile> {
    return this.#profilesEndpoint.getById(id);
  }

  updateProfile(profile: CompanyProfile): Observable<CompanyProfile> {
    return this.#profilesEndpoint.update(profile, profile.id);
  }
}
