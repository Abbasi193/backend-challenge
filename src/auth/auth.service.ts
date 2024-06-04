import { Injectable } from '@nestjs/common';
import { OutlookService } from 'src/outlook/outlook.service';

@Injectable()
export class AuthService {
  constructor(private readonly outlookService: OutlookService) {}

  getAuthURL(type: string) {
    return this.outlookService.getAuthURL(type);
  }

  async getToken(code: string, type: string) {
    return await this.outlookService.getToken(code, type);
  }
}
