import { inject, Injectable } from '@angular/core';
import { IamStore } from '../../iam/application/iam.store';
import { RentalRequesterAccessPort } from './rental-requester-access.port';

/** ACL: translates current IAM session facts into a Rentals permission decision. */
@Injectable()
export class IamRentalRequesterAccessAclAdapter implements RentalRequesterAccessPort {
  readonly #iam = inject(IamStore);

  canSubmitRentalRequest(userId: number): boolean {
    return Number.isInteger(userId) && userId > 0 &&
      this.#iam.isSignedIn() &&
      this.#iam.currentUserId() === userId &&
      this.#iam.currentRole() === 'construction_company';
  }
}
