/** Published language of the Rentals notification REST API. */
export interface RentalNotificationResource {
  id: number;
  referenceId: number;
  type: string;
  title: string;
  message: string;
  occurredAt: string;
  read: boolean;
  readAt: string | null;
  emailStatus: string;
}
