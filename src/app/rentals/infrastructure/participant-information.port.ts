import { InjectionToken } from '@angular/core';

import { Observable } from 'rxjs';

export interface RentalParticipantInformation {
  userId: number;
  firstName: string;
  lastName: string;
  companyName: string;
}

export interface ParticipantInformationPort {
  getParticipantInformationByUserIds(userIds: number[]): Observable<RentalParticipantInformation[]>;
}

export const PARTICIPANT_INFORMATION_PORT = new InjectionToken<ParticipantInformationPort>(
  'PARTICIPANT_INFORMATION_PORT',
);
