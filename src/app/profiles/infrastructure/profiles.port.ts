import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { UpdateProfileCommand } from '../domain/model/update-profile.command';
import { ProfileResource } from './profile-response';

export interface ProfilesPort {
  getProfile(userId: number): Observable<ProfileResource>;

  updateProfile(userId: number, command: UpdateProfileCommand): Observable<ProfileResource>;
}

export const PROFILES_PORT = new InjectionToken<ProfilesPort>('PROFILES_PORT');
