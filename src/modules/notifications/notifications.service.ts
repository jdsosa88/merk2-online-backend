import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { UsersService } from '../users/users.service';
import { OrderStatus } from '../orders/types/orders.type';

export type PushData = Record<string, unknown>;

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

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(
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

  async notifyOrderStatusChange(params: {
    customerId: string;
    orderId: string;
    status: OrderStatus;
  }): Promise<void> {
    const copy = ORDER_STATUS_COPY[params.status];
    if (!copy) return;

    const orderRef = `#${params.orderId.slice(-6)}`;
    await this.sendToUser(params.customerId, copy.title, copy.body(orderRef), {
      type: 'order_status',
      orderId: params.orderId,
      status: params.status,
      screen: 'order-detail',
    });
  }

  async notifyMessengerAssigned(params: {
    messengerId: string;
    orderId: string;
  }): Promise<void> {
    const orderRef = `#${params.orderId.slice(-6)}`;
    await this.sendToUser(
      params.messengerId,
      'Nueva entrega asignada',
      `Te asignaron el pedido ${orderRef}`,
      {
        type: 'messenger_assigned',
        orderId: params.orderId,
        screen: 'order-detail',
      },
    );
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
}
