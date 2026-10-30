export type ActionStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'cancelled'
  | 'expired'
  | 'failed';

export interface ActionCardData {
  actionId: string;
  type:
    | 'report.create'
    | 'report.comment'
    | 'report.reopen'
    | 'report.cancel'
    | 'report.support'
    | 'report.status'
    | 'report.assign';
  status: ActionStatus;
  expiresAt: string;
  summary: {
    title: string;
    fields: { label: string; value: string }[];
    photos?: string[];
    editable?: boolean;
    notice?: string;
    confirmLabel?: string;
    destructive?: boolean;
  };
}

export interface Attachment {
  id: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards: ActionCardData[];
  replies?: string[];
  attachments?: Attachment[];
  streaming?: boolean;
  error?: boolean;
}

export type ChatLanguage =
  | 'auto'
  | 'en'
  | 'hi'
  | 'mr'
  | 'ta'
  | 'te'
  | 'bn'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'pa';
