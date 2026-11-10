import { api } from './client';

export interface ChatConversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
}

export interface ChatConversationCreated {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  sender: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  provider?: string;
}

export interface ChatHistory {
  conversationId: number;
  messages: ChatMessage[];
}

export interface ChatSuggestion {
  key: string;
  label: string;
}

export interface ChatSuggestionsResponse {
  freeTextEnabled: boolean;
  suggestions: ChatSuggestion[];
}

export const chatApi = {
  suggestions: () => api.get<ChatSuggestionsResponse>('/chat/suggestions'),
  conversations: () => api.get<ChatConversation[]>('/chat/conversations'),
  createConversation: () => api.post<ChatConversationCreated>('/chat/conversations', {}),
  history: (id: number) => api.get<ChatHistory>(`/chat/conversations/${id}`),
  sendTopic: (conversationId: number, topic: string) =>
    api.post<ChatMessage>('/chat/messages', { conversationId, topic }),
  sendText: (conversationId: number, text: string) =>
    api.post<ChatMessage>('/chat/messages', { conversationId, text }),
  send: (conversationId: number, topic: string) =>
    api.post<ChatMessage>('/chat/messages', { conversationId, topic }),
};
