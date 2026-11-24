import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RentalNotificationApi } from '../../rentals/infrastructure/rental-notification-api';
import { NotificationInboxItem, NotificationSource, notificationSources } from '../application/models/notification-inbox-item';
import { BaseApi } from './base-api';

/** REST representation used for the five non-Rentals inboxes. */
interface NotificationResource extends Omit<NotificationInboxItem, 'source' | 'occurredAt' | 'readAt'> {
  occurredAt: string;
  readAt: string | null;
}

export interface NotificationSourceResult {
  readonly source: NotificationSource;
  readonly items: NotificationInboxItem[] | null;
}

const paths: Record<Exclude<NotificationSource, 'rentals'>, string> = {
  iam: environment.platformProviderIamNotificationsEndpointPath,
  profiles: environment.platformProviderProfileNotificationsEndpointPath,
  inventory: environment.platformProviderInventoryNotificationsEndpointPath,
  maintenance: environment.platformProviderMaintenanceNotificationsEndpointPath,
  subscriptions: environment.platformProviderSubscriptionsNotificationsEndpointPath,
};

/** UI composition adapter. All authorization and writes remain in the owning API. */
@Injectable({ providedIn: 'root' })
export class NotificationInboxApi extends BaseApi {
  readonly #rentals = inject(RentalNotificationApi);

  getNotifications(language: string): Observable<NotificationSourceResult[]> {
    return forkJoin(notificationSources.map(source => this.getSource(source, language).pipe(
      timeout(12000),
      map(items => ({ source, items })),
      catchError(() => of({ source, items: null })),
    )));
  }

  markAsRead(source: NotificationSource, id: number, language: string): Observable<NotificationInboxItem> {
    if (source === 'rentals') {
      return this.#rentals.markNotificationAsRead(id, language).pipe(map(item => ({ ...item, source })));
    }
    return this.http.patch<NotificationResource>(`${this.url(source)}/${id}/read`, null, this.options(language)).pipe(
      map(resource => this.toItem(source, resource)),
    );
  }

  private getSource(source: NotificationSource, language: string): Observable<NotificationInboxItem[]> {
    if (source === 'rentals') {
      return this.#rentals.getNotifications(language).pipe(map(items => items.map(item => ({ ...item, source }))));
    }
    return this.http.get<NotificationResource[]>(this.url(source), this.options(language)).pipe(
      map(resources => resources.map(resource => this.toItem(source, resource))),
    );
  }

  private url(source: Exclude<NotificationSource, 'rentals'>): string {
    return `${environment.platformProviderApiBaseUrl}${paths[source]}`;
  }

  private options(language: string): { headers: Record<string, string> } {
    return { headers: { 'Accept-Language': language === 'es' ? 'es-PE' : 'en' } };
  }

  private toItem(source: NotificationSource, resource: NotificationResource): NotificationInboxItem {
    return { ...resource, source, occurredAt: new Date(resource.occurredAt),
      readAt: resource.readAt ? new Date(resource.readAt) : null };
  }
}
