import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { catchError, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';

import {
  ParticipantInformationPort,
  RentalParticipantInformation,
} from './participant-information.port';

interface ExternalProfileResource {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  companyName: string;
}

interface ExternalProfilesResponse {
  profiles: ExternalProfileResource[];
}

@Injectable()
export class ProfilesParticipantInformationAclAdapter
  extends ErrorHandlingEnabledBaseType
  implements ParticipantInformationPort
{
  readonly #http = inject(HttpClient);

  readonly #endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderProfilesEndpointPath}`;

  getParticipantInformationByUserIds(
    userIds: number[],
  ): Observable<RentalParticipantInformation[]> {
    const requestedIds = new Set(userIds);

    return this.#http
      .get<ExternalProfileResource[] | ExternalProfilesResponse>(this.#endpointUrl)
      .pipe(
        map((response) => {
          const resources = Array.isArray(response) ? response : response.profiles;

          return resources
            .filter((resource) => requestedIds.has(resource.userId))
            .map((resource) => ({
              userId: resource.userId,

              firstName: resource.firstName,

              lastName: resource.lastName,

              companyName: resource.companyName,
            }));
        }),

        catchError(this.handleError('Failed to fetch participant information')),
      );
  }
}
