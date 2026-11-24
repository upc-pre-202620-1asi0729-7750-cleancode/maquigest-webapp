import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { NotificationInboxItem, NotificationSource, notificationKey, notificationSources } from '../../../application/models/notification-inbox-item';
import { NotificationInboxStore } from '../../../application/notification-inbox.store';

@Component({
  selector: 'app-notification-bell',
  imports: [DatePipe, RouterLink, TranslatePipe],
  providers: [NotificationInboxStore],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBell {
  protected readonly store = inject(NotificationInboxStore);
  readonly #iam = inject(IamStore);
  protected readonly open = signal(false);
  protected readonly source = signal<NotificationSource | 'all'>('all');
  protected readonly onlyUnread = signal(false);
  protected readonly sources = notificationSources;
  protected readonly key = notificationKey;
  protected readonly visibleNotifications = computed(() => this.store.notifications().filter(item =>
    (this.source() === 'all' || item.source === this.source()) && (!this.onlyUnread() || !item.read)));

  protected toggle(): void {
    this.open.update(value => !value);
    if (this.open()) this.store.refresh();
  }

  @HostListener('document:keydown.escape')
  protected close(): void { this.open.set(false); }

  protected operationLink(item: NotificationInboxItem): (string | number)[] {
    const role = this.#iam.currentRole();
    switch (item.source) {
      case 'iam': return ['/dashboard'];
      case 'profiles': return ['/profiles/profile'];
      case 'inventory': return ['/inventory/equipment', item.referenceId];
      case 'maintenance': return role === 'rental_company'
        ? [item.type.startsWith('INCIDENT_') ? '/maintenance/incidents' : '/maintenance'] : ['/dashboard'];
      case 'subscriptions': return ['/subscriptions/plans'];
      case 'rentals':
        if (role === 'construction_company') return item.type.startsWith('RENTAL_REQUEST_')
          ? ['/rentals/my-requests', item.referenceId] : ['/rentals/my-requests'];
        return item.type.startsWith('RENTAL_REQUEST_') ? ['/rentals/requests'] : ['/rentals/active'];
    }
  }
}
