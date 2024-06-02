import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Email } from 'src/emails/schemas/email.schema';
import { Folder } from 'src/emails/schemas/folder.schema';

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

  async findEmails(token: string, skip: number): Promise<Email[]> {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/messages?select=subject,bodyPreview,sender,toRecipients,isRead,id,lastModifiedDateTime&$top=1000&$skip=${skip}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const { value } = response.data;
    return value.map((email: any) => {
      try {
        return {
          subject: email.subject,
          body: email.bodyPreview,
          senderEmail: email.sender?.emailAddress?.address,
          recipientEmail: email.toRecipients?.map(
            (recipient: any) => recipient.emailAddress?.address,
          ),
          isRead: email.isRead,
          externalId: email.id,
          externalUpdatedAt: email.lastModifiedDateTime,
        };
      } catch (error) {}
    });
  }

  async findFolders(token: string, skip: number): Promise<Folder[]> {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/mailFolders?$top=100&$skip=${skip}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const { value } = response.data;
    return value.map((folder: any) => {
      try {
        return {
          displayName: folder.displayName,
          unreadItemCount: folder.unreadItemCount,
          totalItemCount: folder.totalItemCount,
          isHidden: folder.isHidden,
          externalId: folder.id,
        };
      } catch (error) {}
    });
  }
}
