import { api } from './client';
import { mockAiChatReply } from './mock/aiChat';
import type { AiChatRequest, AiChatResponse } from './types/aiChat';

/**
 * Bật dữ liệu giả bằng biến môi trường Vite:
 *   VITE_USE_MOCK=true npm run dev
 * Không sửa `http.ts`/`client.ts` của Tùng; mọi request thật vẫn đi qua `api`.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function sendChat(message: string): Promise<string> {
  const trimmed = message.trim();

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return mockAiChatReply(trimmed);
  }

  const body: AiChatRequest = { message: trimmed };
  const res = await api.post<AiChatResponse>('/ai/chat', body);
  return res.reply;
}
