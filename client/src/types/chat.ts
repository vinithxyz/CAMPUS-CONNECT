export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: ChatAction;
  createdAt?: string;
}

export interface ReportDraft {
  category: string;
  title: string;
  description: string;
  building: string;
  buildingName: string;
  room: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  lat: number;
  lng: number;
}

export type ChatAction = {
  type: 'prefill_report';
  draft: ReportDraft;
};
