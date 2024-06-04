import { Injectable } from '@nestjs/common';
import { ImapMessageAttributes, ImapMessageBodyInfo } from 'imap';
import { connect, ImapSimpleOptions, ImapSimple } from 'imap-simple';
import { Email } from 'src/emails/schemas/email.schema';
import { MailBox } from 'src/emails/schemas/mailBox.schema';
const { simpleParser } = require('mailparser');

type ImapMessageBodyInfoWithBody = ImapMessageBodyInfo & { body: string };
type FetchedMessage = {
  seqno: number;
  parts: ImapMessageBodyInfoWithBody[];
  attrs: ImapMessageAttributes;
};

const MAX_REQUESTS = 1000;
const PAGE_SIZE = 100;

const imapConfig: ImapSimpleOptions = {
  imap: {
    user: 'user@hotmail.com',
    password: 'password',
    // xoauth2: btoa(`user=${email}\x01auth=Bearer ${token}\x01\x01`),
    host: 'imap-mail.outlook.com',
    port: 993,
    tls: true,
    authTimeout: 3000,
  },
};

@Injectable()
export class ImapService {
  async connectToImap(mailBox?: any) {
    try {
      const connection = await connect(imapConfig);

      connection.on('error', (err) => {
        console.error('IMAP Error:', err);
      });

      connection.on('end', () => {
        console.log('IMAP Connection ended');
      });
      if (mailBox) {
        await connection.openBox(mailBox);
        console.log('Connected to INBOX...');
      }

      return connection;
    } catch (error) {
      console.error('Failed to connect to IMAP server:', error);
      throw error;
    }
  }

  async getEmails(
    connection: ImapSimple,
    searchCriteria = ['UNSEEN'],
  ): Promise<Email[]> {
    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE Message-ID)', 'TEXT'],
      struct: true,
      markSeen: false,
    };

    const paginatedMessages: FetchedMessage[] = await new Promise(
      async (resolve, reject) => {
        connection.imap.search(searchCriteria, function (err, results) {
          const f = connection.imap.fetch(results, fetchOptions);

          const fetchedMessages: FetchedMessage[] = [];

          f.on('message', (msg, seqno) => {
            const parts: ImapMessageBodyInfoWithBody[] = [];

            msg.on('body', (stream, info) => {
              let buffer = '';

              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });

              stream.on('end', () => {
                parts.push({
                  which: info.which,
                  size: info.size,
                  body: buffer,
                });
              });
            });

            msg.on('attributes', (attrs) => {
              fetchedMessages.push({
                seqno,
                parts,
                attrs,
              });
            });
          });

          f.on('error', reject);
          f.on('end', () => resolve(fetchedMessages));
        });
      },
    );

    const emails: any = await Promise.all(
      paginatedMessages
        .map((message) => {
          try {
            return this.parseEmail(message);
          } catch (error) {}
        })
        .filter((e: any) => e != null && e != undefined),
    );

    return emails;
  }

  async startListening(
    mailBox: MailBox,
    onMail: (param: Email) => void,
    onUpdate: (param: Email) => void,
  ) {
    const connection = await this.connectToImap(mailBox.displayName);

    connection.on('mail', async () => {
      try {
        const emails = await this.getEmails(connection, ['RECENT']);
        await onMail(emails[0]);
      } catch {}
    });

    connection.on('update', async (seqno) => {
      try {
        const emails = await this.getEmails(connection, [`${seqno}:${seqno}`]);
        await onUpdate(emails[0]);
      } catch {}
    });
  }

  async fetchPaginatedEmails(
    mailBox: MailBox,
    callback: (emails: Email[]) => Promise<void>,
  ) {
    const connection = await this.connectToImap(mailBox.displayName);

    await this.run(async (itemCount) => {
      if (itemCount > mailBox.totalItemCount) return 0;
      const emails = await this.getEmails(connection, [
        'ALL',
        `${Math.max(itemCount, 1)}:${Math.min(itemCount + PAGE_SIZE, mailBox.totalItemCount)}`,
      ]);
      await callback(emails);
      return emails.length;
    });
    await connection.end();
  }

  async getMailBoxInfo(): Promise<MailBox[]> {
    const connection = await this.connectToImap();

    let data: any = [];
    const boxes = Object.keys(await connection.getBoxes());

    for (const mailBox of boxes) {
      data.push(await connection.openBox(mailBox));
      await connection.closeBox(false);
    }
    data = data.map((e: any) => {
      console.log(e);
      return {
        displayName: e.name,
        totalItemCount: e.messages.total,
      };
    });
    await connection.end();

    return data;
  }

  async run(callback: (x: number) => Promise<number>) {
    let requestCount = 0;
    let itemCount = 0;
    let hasMoreItems = true;

    while (hasMoreItems && requestCount < MAX_REQUESTS) {
      const count = await callback(itemCount);
      itemCount += count;
      requestCount++;
      hasMoreItems = count > 0;
    }
    return itemCount;
  }

  async parseEmail(message: FetchedMessage): Promise<Email> {
    const header: any = message.parts.find(
      (part) =>
        part.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE Message-ID)',
    );
    const body: any = message.parts.find((part) => part.which === 'TEXT');

    const parsedBody = await simpleParser(body.body);
    const parsedHeader = await simpleParser(header.body);

    return {
      body: parsedBody.text,
      externalId: parsedHeader.messageId,
      emailAccount: '',
      subject: parsedHeader.subject,
      date: parsedHeader.date,
      recipientEmails: parsedHeader.to?.value?.map((v: any) => v.address),
      senderEmail: parsedHeader.from?.value?.map((v: any) => v.address)[0],
      isRead: message.attrs.flags.includes('\\Seen'),
    };
  }
}
