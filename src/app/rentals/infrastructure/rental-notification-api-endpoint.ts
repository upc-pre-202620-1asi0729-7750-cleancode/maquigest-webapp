import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RentalNotification } from '../domain/model/rental-notification.entity';
import { RentalNotificationAssembler } from './rental-notification-assembler';
import { RentalNotificationResource } from './rental-notification-response';

/** Recipient identity is resolved by the server from the JWT. */
export class RentalNotificationApiEndpoint {
  readonly #url = `${environment.platformProviderApiBaseUrl}${environment.platformProviderRentalNotificationsEndpointPath}`;
  readonly #assembler = new RentalNotificationAssembler();

  constructor(private readonly http: HttpClient) {}

  getAll(language: string): Observable<RentalNotification[]> {
    return this.http.get<RentalNotificationResource[]>(this.#url, this.options(language)).pipe(
      map(resources => resources.map(resource => this.#assembler.toEntityFromResource(resource))),
    );
  }

  getById(id: number, language: string): Observable<RentalNotification> {
    return this.http.get<RentalNotificationResource>(`${this.#url}/${id}`, this.options(language)).pipe(
      map(resource => this.#assembler.toEntityFromResource(resource)),
    );
  }

  markAsRead(id: number, language: string): Observable<RentalNotification> {
    return this.http.patch<RentalNotificationResource>(`${this.#url}/${id}/read`, null, this.options(language)).pipe(
      map(resource => this.#assembler.toEntityFromResource(resource)),
    );
  }

  private options(language: string): { headers: Record<string, string> } {
    return { headers: { 'Accept-Language': language === 'es' ? 'es-PE' : 'en' } };
  }
}
