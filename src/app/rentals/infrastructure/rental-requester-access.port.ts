import { InjectionToken } from '@angular/core';

/** Rentals-owned anti-corruption port for the currently signed-in requester. */
export interface RentalRequesterAccessPort {
  canSubmitRentalRequest(userId: number): boolean;
}

export const RENTAL_REQUESTER_ACCESS_PORT = new InjectionToken<RentalRequesterAccessPort>(
  'RENTAL_REQUESTER_ACCESS_PORT',
);
