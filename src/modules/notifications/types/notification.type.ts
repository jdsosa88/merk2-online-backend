export enum NotificationType {
  ORDER_STATUS = 'order_status',
  ORDER_CREATED = 'order_created',
  MESSENGER_ASSIGNED = 'messenger_assigned',
  APP_UPDATE = 'app_update',
  INFO = 'info',
}

export const BROADCAST_NOTIFICATION_TYPES = [
  NotificationType.APP_UPDATE,
  NotificationType.INFO,
] as const;

export type BroadcastNotificationType =
  (typeof BROADCAST_NOTIFICATION_TYPES)[number];
