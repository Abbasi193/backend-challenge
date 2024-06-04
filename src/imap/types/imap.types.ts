import { ImapMessageAttributes, ImapMessageBodyInfo } from 'imap';

export type ImapMessageBodyInfoWithBody = ImapMessageBodyInfo & {
  body: string;
};
export type FetchedMessage = {
  seqno: number;
  parts: ImapMessageBodyInfoWithBody[];
  attrs: ImapMessageAttributes;
};
