import { Injectable } from '@nestjs/common';
import { OutlookService } from 'src/outlook/outlook.service';

@Injectable()
export class AuthService {
  constructor(private readonly outlookService: OutlookService) {}

  getAuthURL() {
    return this.outlookService.getAuthURL();
  }

  async getToken(code: string) {
    return await this.outlookService.getToken(code);
  }
}
