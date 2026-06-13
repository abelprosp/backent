import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { assertSqlIdentifier } from '@/common/security/sql.util';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [
      'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ??
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      if (payload.type !== 'access') {
        client.disconnect(true);
        return;
      }
      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {
    // rooms cleaned automatically
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    client: Socket,
    payload: { projectId: string; table: string },
  ) {
    if (!client.data.userId) return { event: 'error', data: { message: 'Unauthorized' } };

    try {
      assertSqlIdentifier(payload.table, 'tabela');
    } catch {
      return { event: 'error', data: { message: 'Tabela inválida' } };
    }

    const channel = `${payload.projectId}:${payload.table}`;
    client.join(channel);
    return { event: 'subscribed', data: { channel } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    client: Socket,
    payload: { projectId: string; table: string },
  ) {
    const channel = `${payload.projectId}:${payload.table}`;
    client.leave(channel);
    return { event: 'unsubscribed', data: { channel } };
  }

  broadcastChange(
    projectId: string,
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    record: Record<string, unknown>,
  ) {
    const channel = `${projectId}:${table}`;
    this.server.to(channel).emit('change', { event, table, record });
  }
}

@WebSocketGateway()
export class RealtimeService {
  constructor(private gateway: RealtimeGateway) {}

  notify(
    projectId: string,
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    record: Record<string, unknown>,
  ) {
    this.gateway.broadcastChange(projectId, table, event, record);
  }
}
