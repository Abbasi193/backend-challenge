import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway()
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  @UseGuards(JwtAuthGuard)
  async handleConnection(client: Socket) {
    try {
      const userId = await this.getUserId(client);

      client.join(userId);

      console.log('Client connected:', client.id);
    } catch (error) {
      client.disconnect();
    }
  }

  async getUserId(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];
    if (!token) throw Error('Unauthorized');
    const payload = await this.jwtService.verify(token);
    return payload.sub;
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = await this.getUserId(client);
      client.leave(userId);

      console.log('Client disconnected:', client.id);
    } catch (error) {}
  }

  sendEvent(event: string, userId: string, data: any) {
    this.server.to(userId.toString()).emit(event, data);
  }
}
