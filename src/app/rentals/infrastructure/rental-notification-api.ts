import { Injectable } from '@angular/core';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { RentalNotificationApiEndpoint } from './rental-notification-api-endpoint';

@Injectable({ providedIn: 'root' })
export class RentalNotificationApi extends BaseApi {
  readonly #endpoint = new RentalNotificationApiEndpoint(this.http);

  getNotifications(language: string) { return this.#endpoint.getAll(language); }
  getNotification(id: number, language: string) { return this.#endpoint.getById(id, language); }
  markNotificationAsRead(id: number, language: string) { return this.#endpoint.markAsRead(id, language); }
}
