import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { Email } from 'src/emails/schemas/email.schema';
import { Folder } from 'src/emails/schemas/folder.schema';
import { Request } from 'express';
import { EmailsService } from 'src/emails/emails.service';

@Injectable()
export class OutlookService {
  constructor(
    @Inject(forwardRef(() => EmailsService))
    private readonly emailService: EmailsService,
  ) {}

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
          emailAccount: '',
          senderEmail: email.sender?.emailAddress?.address,
          recipientEmails: email.toRecipients?.map(
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

    return {
      subject: email.subject,
      body: email.bodyPreview,
      emailAccount: '',
      senderEmail: email.sender?.emailAddress?.address,
      recipientEmails: email.toRecipients?.map(
        (recipient: any) => recipient.emailAddress?.address,
      ),
      isRead: email.isRead,
      externalId: email.id,
      externalUpdatedAt: email.lastModifiedDateTime,
    };
  }

  async registerWebhook(token: string): Promise<string> {
    try {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      const response = await axios.post(
        `https://graph.microsoft.com/v1.0/subscriptions`,
        {
          changeType: 'created,updated,deleted',
          notificationUrl: `${process.env.WEBHOOK_URL}/emails/notification`,
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
      return error.response.data;
    }
  }

  // async handleUpdated(id: string) {
  //   // const email = await this.findEmail(id)
  // }

  async handleNotification(req: Request) {
    if (req.query.validationToken) {
      return req.query.validationToken;
    }
    const data = req.body.value[0];

    if (data.clientState !== process.env.CLIENT_STATE) {
      throw new UnauthorizedException();
    }
    if (data.changeType == 'updated') {
      // await this.handleUpdated(data.resourceData.id);
    }
  }
}
