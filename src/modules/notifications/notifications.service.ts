import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { OrderStatus } from '../orders/types/orders.type';

export type PushData = Record<string, unknown>;

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
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

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: PushData,
  ): Promise<{ tokenCount: number }> {
    const tokens = await this.usersService.getExpoPushTokens(userId);
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

    const messages = uniqueTokens.map((to) => ({
      to,
      sound: 'default' as const,
      title,
      body,
      data,
    }));

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      };

      const accessToken = this.configService.get<string>('expo.accessToken');
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`Expo push HTTP ${response.status}: ${text}`);
        return;
      }

      const json = (await response.json()) as {
        data?: ExpoPushTicket | ExpoPushTicket[];
      };
      const tickets = Array.isArray(json.data)
        ? json.data
        : json.data
          ? [json.data]
          : [];

      await this.cleanupInvalidTokens(uniqueTokens, tickets, userIdForCleanup);
    } catch (error) {
      this.logger.warn(
        `Failed to send Expo push: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async cleanupInvalidTokens(
    tokens: string[],
    tickets: ExpoPushTicket[],
    userId?: string,
  ): Promise<void> {
    if (!userId) return;

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const token = tokens[i];
      if (!ticket || !token || ticket.status !== 'error') continue;

      const errorCode = ticket.details?.error;
      if (errorCode === 'DeviceNotRegistered') {
        await this.usersService.removeExpoPushToken(userId, token);
        this.logger.log(`Removed stale Expo push token for user ${userId}`);
      }
    }
  }
}
