import { Injectable } from '@nestjs/common';
@Injectable()
export class EventsService {
  findAll() {
    return `This action returns all events`;
  }
}
