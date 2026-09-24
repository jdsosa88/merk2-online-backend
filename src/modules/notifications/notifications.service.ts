import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { OrderStatus } from '../orders/types/orders.type';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  BroadcastNotificationType,
  NotificationType,
} from './types/notification.type';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';

export type PushData = Record<string, unknown>;

export type NotifyUserParams = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: PushData;
  relatedOrder?: string;
  isReservationRelated?: boolean;
};

const ORDER_STATUS_COPY: Record<
  OrderStatus,
  { title: string; body: (orderRef: string) => string }
> = {
  [OrderStatus.REQUESTED]: {
    title: 'Pedido recibido',
    body: (ref) => `Tu pedido ${ref} fue recibido`,
  },
  [OrderStatus.IN_PREPARATION]: {
    title: 'En preparación',
    body: (ref) => `Tu pedido ${ref} está en preparación`,
  },
  [OrderStatus.READY_FOR_DELIVERY]: {
    title: 'Listo para entrega',
    body: (ref) => `Tu pedido ${ref} está listo para entrega`,
  },
  [OrderStatus.ON_THE_WAY]: {
    title: 'En camino',
    body: (ref) => `Tu pedido ${ref} va en camino`,
  },
  [OrderStatus.COMPLETED]: {
    title: 'Pedido entregado',
    body: (ref) => `Tu pedido ${ref} fue entregado`,
  },
  [OrderStatus.CANCELLED]: {
    title: 'Pedido cancelado',
    body: (ref) => `Tu pedido ${ref} fue cancelado`,
  },
  [OrderStatus.REJECTED]: {
    title: 'Pedido rechazado',
    body: (ref) => `Tu pedido ${ref} fue rechazado`,
  },
  [OrderStatus.ABORTED]: {
    title: 'Pedido abortado',
    body: (ref) => `Tu pedido ${ref} fue abortado`,
  },
  [OrderStatus.RETURNED]: {
    title: 'Pedido devuelto',
    body: (ref) => `Tu pedido ${ref} fue marcado como devuelto`,
  },
};

const HAVANA_TZ = 'America/Havana';

function startOfDayInTimeZone(timeZone: string, date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  // Approximate UTC instant for local midnight by probing offsets
  const guessUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const getParts = (ms: number) => {
    const map: Record<string, string> = {};
    for (const p of formatter.formatToParts(new Date(ms))) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    return map;
  };

  let lo = guessUtc - 36 * 3600 * 1000;
  let hi = guessUtc + 36 * 3600 * 1000;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const p = getParts(mid);
    const midDay = `${p.year}-${p.month}-${p.day}`;
    const target = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const midTime = Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second);
    if (midDay < target || (midDay === target && midTime > 0)) {
      lo = mid + 1;
    } else if (midDay > target) {
      hi = mid;
    } else {
      // midDay === target && midTime === 0
      return new Date(mid);
    }
  }
  return new Date(lo);
}

function orderRef(orderId: string): string {
  return `#${orderId.slice(-6)}`;
}

function extractId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (ref instanceof Types.ObjectId) return ref.toString();
  if (typeof ref === 'object' && ref !== null && '_id' in ref) {
    return String((ref as { _id: Types.ObjectId | string })._id);
  }
  return null;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.initFirebase();
  }

  private initFirebase() {
    if (admin.apps.length > 0) {
      this.messaging = admin.messaging();
      return;
    }

    const serviceAccountPath = this.configService.get<string>(
      'firebase.serviceAccountPath',
    );
    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');

    try {
      if (serviceAccountPath) {
        if (!existsSync(serviceAccountPath)) {
          this.logger.warn(
            `FIREBASE_SERVICE_ACCOUNT_PATH no existe: ${serviceAccountPath}`,
          );
          return;
        }
        const raw = readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        this.logger.warn(
          'Firebase no configurado (FIREBASE_SERVICE_ACCOUNT_PATH o FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY). Push FCM deshabilitado.',
        );
        return;
      }

      this.messaging = admin.messaging();
      this.logger.log('Firebase Admin inicializado para push FCM');
    } catch (error) {
      this.logger.error(
        `No se pudo inicializar Firebase Admin: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async notifyUser(params: NotifyUserParams): Promise<NotificationDocument> {
    const doc = await this.notificationModel.create({
      user: new Types.ObjectId(params.userId),
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data ?? {},
      relatedOrder: params.relatedOrder
        ? new Types.ObjectId(params.relatedOrder)
        : undefined,
      isReservationRelated: Boolean(params.isReservationRelated),
    });

    const pushData: PushData = {
      ...(params.data ?? {}),
      type: params.type,
      notificationId: doc._id.toString(),
      ...(params.relatedOrder ? { orderId: params.relatedOrder } : {}),
    };

    await this.sendToUser(
      params.userId,
      params.title,
      params.body,
      pushData,
    ).catch((err) =>
      this.logger.warn(
        `Push failed for user ${params.userId}: ${err?.message ?? err}`,
      ),
    );

    return doc;
  }

  async notifyUsers(
    userIds: string[],
    params: Omit<NotifyUserParams, 'userId'>,
  ): Promise<void> {
    const unique = [...new Set(userIds.filter(Boolean))];
    await Promise.all(
      unique.map((userId) => this.notifyUser({ ...params, userId })),
    );
  }

  /**
   * New order (checkout): notify store owner + all store messengers.
   */
  async notifyOrderCreatedToStore(params: {
    orderId: string;
    storeOwnerId: string;
    storeMessengerIds: string[];
    isReservationRelated?: boolean;
  }): Promise<void> {
    const recipients = [
      params.storeOwnerId,
      ...(params.storeMessengerIds ?? []),
    ];
    const ref = orderRef(params.orderId);
    await this.notifyUsers(recipients, {
      type: NotificationType.ORDER_CREATED,
      title: 'Nuevo pedido',
      body: `Se confirmó el pedido ${ref}`,
      data: {
        orderId: params.orderId,
        screen: 'order-detail',
      },
      relatedOrder: params.orderId,
      isReservationRelated: params.isReservationRelated,
    });
  }

  /**
   * Status-change matrix:
   * - in_preparation: customer + store messengers (≠ actor); include assignedMessenger if ≠ actor
   * - on_the_way: customer
   * - completed: store owner if owner is not the delivering messenger
   * - other statuses: customer (legacy)
   */
  async notifyOrderStatusRecipients(params: {
    orderId: string;
    status: OrderStatus;
    previousStatus?: OrderStatus;
    customerId?: string | null;
    storeOwnerId?: string | null;
    storeMessengerIds?: string[];
    assignedMessengerId?: string | null;
    actorUserId?: string | null;
    isReservationRelated?: boolean;
  }): Promise<void> {
    const copy = ORDER_STATUS_COPY[params.status];
    if (!copy) return;

    const ref = orderRef(params.orderId);
    const title = copy.title;
    const body = copy.body(ref);
    const base = {
      type: NotificationType.ORDER_STATUS as const,
      title,
      body,
      data: {
        orderId: params.orderId,
        status: params.status,
        screen: 'order-detail',
      },
      relatedOrder: params.orderId,
      isReservationRelated: params.isReservationRelated,
    };

    const actor = params.actorUserId ?? null;
    const recipients = new Set<string>();

    if (params.status === OrderStatus.IN_PREPARATION) {
      if (params.customerId) recipients.add(params.customerId);
      for (const id of params.storeMessengerIds ?? []) {
        if (id && id !== actor) recipients.add(id);
      }
      if (
        params.assignedMessengerId &&
        params.assignedMessengerId !== actor
      ) {
        recipients.add(params.assignedMessengerId);
      }
    } else if (params.status === OrderStatus.ON_THE_WAY) {
      if (params.customerId) recipients.add(params.customerId);
    } else if (params.status === OrderStatus.COMPLETED) {
      const owner = params.storeOwnerId;
      const messenger = params.assignedMessengerId || actor;
      // Seller when they are not the delivering messenger
      if (owner && owner !== messenger) {
        recipients.add(owner);
      }
      if (params.customerId) recipients.add(params.customerId);
    } else {
      if (params.customerId) recipients.add(params.customerId);
    }

    await this.notifyUsers([...recipients], base);
  }

  /** @deprecated Prefer notifyOrderStatusRecipients — kept for simple customer-only calls */
  async notifyOrderStatusChange(params: {
    customerId: string;
    orderId: string;
    status: OrderStatus;
    isReservationRelated?: boolean;
  }): Promise<void> {
    await this.notifyOrderStatusRecipients({
      orderId: params.orderId,
      status: params.status,
      customerId: params.customerId,
      isReservationRelated: params.isReservationRelated,
    });
  }

  async notifyMessengerAssigned(params: {
    messengerId: string;
    orderId: string;
    isReservationRelated?: boolean;
  }): Promise<void> {
    const ref = orderRef(params.orderId);
    await this.notifyUser({
      userId: params.messengerId,
      type: NotificationType.MESSENGER_ASSIGNED,
      title: 'Nueva entrega asignada',
      body: `Te asignaron el pedido ${ref}`,
      data: {
        orderId: params.orderId,
        screen: 'order-detail',
      },
      relatedOrder: params.orderId,
      isReservationRelated: params.isReservationRelated,
    });
  }

  async broadcast(
    dto: BroadcastNotificationDto,
  ): Promise<{ notifiedUsers: number }> {
    const userIds = await this.usersService.findAllActiveUserIds();
    const content = dto.content?.trim();
    const data: PushData = {
      type: dto.type,
      screen: 'notification-detail',
      ...(content ? { content } : {}),
    };

    await this.notifyUsers(userIds, {
      type: dto.type as BroadcastNotificationType,
      title: dto.title.trim(),
      body: dto.body.trim(),
      data,
      isReservationRelated: false,
    });

    return { notifiedUsers: userIds.length };
  }

  async listForUser(userId: string): Promise<Notification[]> {
    const dayStart = startOfDayInTimeZone(HAVANA_TZ);
    return this.notificationModel
      .find({
        user: new Types.ObjectId(userId),
        $or: [
          { createdAt: { $gte: dayStart } },
          { isReservationRelated: true },
        ],
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as Promise<Notification[]>;
  }

  async findOneForUser(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const doc = await this.notificationModel
      .findOne({
        _id: new Types.ObjectId(notificationId),
        user: new Types.ObjectId(userId),
      })
      .lean()
      .exec();
    if (!doc) {
      throw new NotFoundException('Notification not found');
    }
    return doc as Notification;
  }

  async deleteOne(userId: string, notificationId: string): Promise<void> {
    const result = await this.notificationModel
      .deleteOne({
        _id: new Types.ObjectId(notificationId),
        user: new Types.ObjectId(userId),
      })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async deleteAllForUser(userId: string): Promise<{ deleted: number }> {
    const dayStart = startOfDayInTimeZone(HAVANA_TZ);
    const result = await this.notificationModel
      .deleteMany({
        user: new Types.ObjectId(userId),
        $or: [
          { createdAt: { $gte: dayStart } },
          { isReservationRelated: true },
        ],
      })
      .exec();
    return { deleted: result.deletedCount ?? 0 };
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const doc = await this.notificationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          user: new Types.ObjectId(userId),
        },
        { $set: { readAt: new Date() } },
        { new: true },
      )
      .lean()
      .exec();
    if (!doc) {
      throw new NotFoundException('Notification not found');
    }
    return doc as Notification;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const dayStart = startOfDayInTimeZone(HAVANA_TZ);
    const result = await this.notificationModel
      .updateMany(
        {
          user: new Types.ObjectId(userId),
          readAt: { $exists: false },
          $or: [
            { createdAt: { $gte: dayStart } },
            { isReservationRelated: true },
          ],
        },
        { $set: { readAt: new Date() } },
      )
      .exec();
    return { updated: result.modifiedCount ?? 0 };
  }

  /** Daily cleanup at 00:05 America/Havana — keep reservation-related notifications. */
  @Cron('5 0 * * *', { timeZone: HAVANA_TZ })
  async cleanupExpiredNotifications(): Promise<void> {
    const dayStart = startOfDayInTimeZone(HAVANA_TZ);
    const result = await this.notificationModel
      .deleteMany({
        createdAt: { $lt: dayStart },
        isReservationRelated: false,
      })
      .exec();

    // Drop reservation notifications whose related order is no longer a future reservation
    const staleReservations = await this.notificationModel
      .find({ isReservationRelated: true })
      .select('_id relatedOrder')
      .lean()
      .exec();

    // Soft cleanup: if no related order, keep; orders past scheduledFor cleaned by orderId check elsewhere
    this.logger.log(
      `Notification cleanup: deleted ${result.deletedCount ?? 0} daily; reservation inbox count=${staleReservations.length}`,
    );
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: PushData,
  ): Promise<{ tokenCount: number }> {
    const tokens = await this.usersService.getDevicePushTokens(userId);
    if (tokens.length === 0) {
      return { tokenCount: 0 };
    }
    await this.sendToTokens(tokens, title, body, data, userId);
    return { tokenCount: tokens.length };
  }

  async sendTestPushToUser(
    userId: string,
    title?: string,
    body?: string,
  ): Promise<{ tokenCount: number; title: string; body: string }> {
    const pushTitle = title?.trim() || 'Prueba Merk2';
    const pushBody =
      body?.trim() || 'Notificación de prueba enviada desde el backend';
    const result = await this.sendToUser(userId, pushTitle, pushBody, {
      type: 'test',
      screen: 'home',
    });
    return { ...result, title: pushTitle, body: pushBody };
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: PushData,
    userIdForCleanup?: string,
  ): Promise<void> {
    const uniqueTokens = [...new Set(tokens.filter(Boolean))];
    if (uniqueTokens.length === 0) return;

    if (!this.messaging) {
      this.logger.warn(
        'Firebase Messaging no disponible; no se enviaron pushes',
      );
      return;
    }

    const stringData = data
      ? Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
          ]),
        )
      : undefined;

    try {
      const response = await this.messaging.sendEachForMulticast({
        tokens: uniqueTokens,
        notification: { title, body },
        data: stringData,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
          },
        },
      });

      if (response.failureCount > 0) {
        await this.cleanupInvalidTokens(
          uniqueTokens,
          response.responses,
          userIdForCleanup,
        );
      }

      this.logger.log(
        `FCM enviado: ${response.successCount} ok, ${response.failureCount} fail`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to send FCM push: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async cleanupInvalidTokens(
    tokens: string[],
    responses: admin.messaging.SendResponse[],
    userId?: string,
  ): Promise<void> {
    if (!userId) return;

    for (let i = 0; i < responses.length; i++) {
      const result = responses[i];
      const token = tokens[i];
      if (!result || result.success || !token || !result.error) continue;

      const code = result.error.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        await this.usersService.removeDevicePushToken(userId, token);
        this.logger.log(`Removed stale device push token for user ${userId}`);
      }
    }
  }

  /** Helpers exported for orders service */
  static extractRefId = extractId;
}
