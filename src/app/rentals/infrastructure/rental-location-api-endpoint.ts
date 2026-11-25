import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RentalLocation } from '../domain/model/rental-location.entity';

@Injectable({ providedIn: 'root' })
export class RentalLocationApiEndpoint {
  readonly #http = inject(HttpClient);
  lookup(rentalId: number, address: string) {
    return this.#http.get<RentalLocation>(`${environment.platformProviderApiBaseUrl}/rentals/${rentalId}/locations`, { params: { address } });
  }
}
