import { Request } from 'express';
import { Email } from 'src/emails/schemas/email.schema';
import { MailBox } from 'src/emails/schemas/mailBox.schema';

export abstract class BaseEmailProvider {
  abstract findEmails(token: string, skip: number): Promise<Email[]>;

  abstract findMailBoxes(token: string, skip: number): Promise<MailBox[]>;

  abstract handleNotification(
    req: Request,
    callback: (resourceId: string, changeType: string) => Promise<void>,
  ): Promise<any>;
  
  abstract registerWebhook(
    token: string,
    emailAccount: string,
  ): Promise<string>;
}
