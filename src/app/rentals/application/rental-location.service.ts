import { inject, Injectable } from '@angular/core';
import { RentalLocationApiEndpoint } from '../infrastructure/rental-location-api-endpoint';
@Injectable({ providedIn: 'root' })
export class RentalLocationService {
  readonly #api = inject(RentalLocationApiEndpoint);
  lookup(rentalId: number, address: string) { return this.#api.lookup(rentalId, address); }
}
