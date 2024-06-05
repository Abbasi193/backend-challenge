import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { Email } from 'src/emails/schemas/email.schema';
import { MailBox } from 'src/emails/schemas/mailBox.schema';
import { Request } from 'express';
import { BaseEmailProvider } from 'src/common/email-provider';

@Injectable()
export class OutlookService extends BaseEmailProvider {
  getAuthURL(type: string): string {
    const scope =
      type == 'graph'
        ? 'openid%20email%20Mail.Read%20Mail.ReadBasic%20Mail.ReadBasic.Shared%20User.Read'
        : 'openid%20email%20https://outlook.office.com/IMAP.AccessAsUser.All';

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECT_URI}&scope=${scope}`;
  }

  async getToken(code: string, type: string): Promise<any> {
    const scope =
      type == 'graph'
        ? 'openid email Mail.Read Mail.ReadBasic Mail.ReadBasic.Shared User.Read'
        : 'openid email https://outlook.office.com/IMAP.AccessAsUser.All';

    const response = await axios.post(
      `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.CLIENT_ID || 'CLIENT_ID',
        scope: scope,
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

    const email = JSON.parse(atob(response.data.id_token.split('.')[1])).email;

    return { access_token, email };
  }

  async findEmails(token: string, skip: number): Promise<Email[]> {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/messages?select=subject,bodyPreview,sender,toRecipients,isRead,id,parentFolderId,sentDateTime&$top=1000&$skip=${skip}`,
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
        return this.parseEmail(email);
      } catch (error) {}
    });
  }

  async findMailBoxes(token: string, skip: number): Promise<MailBox[]> {
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
          externalId: folder.id,
        };
      } catch (error) {}
    });
  }

  async findEmail(token: string, id: string): Promise<Email> {
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/messages/${id}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const email = response.data;
    return this.parseEmail(email);
  }

  private parseEmail(email: any): Email {
    return {
      subject: email.subject,
      body: email.bodyPreview,
      emailAccount: '',
      userId: '',
      senderEmail: email.sender?.emailAddress?.address,
      recipientEmails: email.toRecipients?.map(
        (recipient: any) => recipient.emailAddress?.address,
      ),
      isRead: email.isRead,
      externalId: email.id,
      date: email.sentDateTime,
      mailBoxId: email.parentFolderId,
    };
  }

  async registerWebhook(token: string, emailAccount: string): Promise<string> {
    try {
      const date = new Date();
      date.setDate(date.getDate() + 6);
      const response = await axios.post(
        `https://graph.microsoft.com/v1.0/subscriptions`,
        {
          changeType: 'created,updated,deleted',
          notificationUrl: `${process.env.WEBHOOK_URL}/emails/notification/microsoft?email=${emailAccount}`,
          resource: '/me/messages',
          expirationDateTime: date.toISOString(),
          clientState: process.env.CLIENT_STATE || '',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.log(error.response.data);
      throw error;
    }
  }

  async handleNotification(
    req: Request,
    callback: (resourceId: string, changeType: string) => Promise<void>,
  ): Promise<any> {
    if (req.query.validationToken) {
      return req.query.validationToken;
    }
    const data = req.body.value[0];

    if (data.clientState !== process.env.CLIENT_STATE) {
      throw new UnauthorizedException();
    }
    await callback(data.resourceData.id, data.changeType);
  }
}
