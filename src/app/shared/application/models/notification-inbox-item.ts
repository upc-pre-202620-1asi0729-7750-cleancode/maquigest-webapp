/** UI read model: not a cross-context domain aggregate. */
export const notificationSources = ['iam', 'profiles', 'inventory', 'rentals', 'maintenance', 'subscriptions'] as const;
export type NotificationSource = typeof notificationSources[number];

export interface NotificationInboxItem {
  readonly source: NotificationSource;
  readonly id: number;
  readonly referenceId: number;
  readonly type: string;
  readonly title: string;
  readonly message: string;
  readonly occurredAt: Date;
  readonly read: boolean;
  readonly readAt: Date | null;
  readonly emailStatus: string;
}

export function notificationKey(item: Pick<NotificationInboxItem, 'source' | 'id'>): string {
  return `${item.source}:${item.id}`;
}

export function sortNotifications(items: readonly NotificationInboxItem[]): NotificationInboxItem[] {
  return [...items].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()
    || a.source.localeCompare(b.source) || b.id - a.id);
}
