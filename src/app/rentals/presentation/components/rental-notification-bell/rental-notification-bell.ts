import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { RentalNotification } from '../../../domain/model/rental-notification.entity';
import { RentalNotificationStore } from '../../../application/rental-notification.store';

@Component({
  selector: 'app-rental-notification-bell',
  imports: [DatePipe, RouterLink, TranslatePipe],
  providers: [RentalNotificationStore],
  templateUrl: './rental-notification-bell.html',
  styleUrl: './rental-notification-bell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalNotificationBell {
  protected readonly store = inject(RentalNotificationStore);
  readonly #iam = inject(IamStore);
  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update(value => !value);
    if (this.open()) this.store.refresh();
  }

  @HostListener('document:keydown.escape')
  protected close(): void { this.open.set(false); }

  protected operationLink(item: RentalNotification): (string | number)[] {
    if (this.#iam.currentRole() === 'construction_company') {
      return item.type.startsWith('RENTAL_REQUEST_')
        ? ['/rentals/my-requests', item.referenceId] : ['/rentals/my-requests'];
    }
    return item.type.startsWith('RENTAL_REQUEST_') ? ['/rentals/requests'] : ['/rentals/active'];
  }
}
