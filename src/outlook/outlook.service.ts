import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OutlookService {
  getAuthURL(): string {
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECT_URI}&scope=openid%20email%20Mail.Read%20Mail.ReadBasic%20Mail.ReadBasic.Shared%20User.Read`;
  }

  async getToken(code: string): Promise<string> {
    const response = await axios.post(
      `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.CLIENT_ID || 'CLIENT_ID',
        scope:
          'openid email Mail.Read Mail.ReadBasic Mail.ReadBasic.Shared User.Read',
        code: code,
        redirect_uri: process.env.REDIRECT_URI || 'REDIRECT_URI',
        grant_type: 'authorization_code',
        client_secret: process.env.CLIENT_SECRET || 'CLIENT_SECRET',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    const { access_token } = response.data;
    return access_token;
  }

  async findAll(token: string) {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/messages?$count=true&select=subject&$top=1`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const { value } = response.data;
    return value;
  }
}
