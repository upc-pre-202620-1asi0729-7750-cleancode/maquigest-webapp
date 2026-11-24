import { RentalNotification } from '../domain/model/rental-notification.entity';
import { RentalNotificationResource } from './rental-notification-response';

export class RentalNotificationAssembler {
  toEntityFromResource(resource: RentalNotificationResource): RentalNotification {
    return new RentalNotification(
      resource.id, resource.referenceId, resource.type, resource.title, resource.message,
      new Date(resource.occurredAt), resource.read,
      resource.readAt ? new Date(resource.readAt) : null, resource.emailStatus,
    );
  }
}
