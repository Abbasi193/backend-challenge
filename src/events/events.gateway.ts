import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { EventsService } from './events.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly eventsService: EventsService) {}
  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  sendEvent(event: string, data: any) {
    this.server.emit(event, data);
  }

  @SubscribeMessage('findAllEvents')
  findAll(@MessageBody() body: any) {
    console.log(body);
    return this.eventsService.findAll();
  }
}
