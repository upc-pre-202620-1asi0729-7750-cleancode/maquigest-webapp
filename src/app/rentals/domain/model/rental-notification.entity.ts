/** Read model for a notification owned by the authenticated recipient. */
export class RentalNotification {
  constructor(
    readonly id: number,
    readonly referenceId: number,
    readonly type: string,
    readonly title: string,
    readonly message: string,
    readonly occurredAt: Date,
    readonly read: boolean,
    readonly readAt: Date | null,
    readonly emailStatus: string,
  ) {}
}
