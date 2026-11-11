import { api } from '@/shared/api/client'
import type { FeedbackChat, FeedbackMessage } from './types'

/**
 * The old panel sent every admin message as user 10 and told its own messages apart by it
 * (pages/feedback.js). Kept as is: the backend may rely on it. Check before changing.
 */
export const ADMIN_USER_ID = 10

export const feedbackKeys = {
  all: ['feedback'] as const,
  chats: ['feedback', 'chats'] as const,
  messages: (userId: number) => ['feedback', 'messages', userId] as const,
}

// Endpoints and bodies match the old panel (pages/feedback.js).
export const feedbackApi = {
  chats: (signal?: AbortSignal) =>
    api.get<FeedbackChat[]>('/v1/feedback/list', { signal }).then((r) => r.data),

  messages: (userId: number, signal?: AbortSignal) =>
    api.get<FeedbackMessage[]>(`/v1/feedback/list/${userId}`, { signal }).then((r) => r.data),

  /**
   * multipart: «file» — a picture ("" without one, as the old page sent), «data» — the message JSON.
   * `chatId` comes from the conversation's messages; in an empty one there is none and the key is
   * left out of the JSON, as the old page's `undefined` was.
   */
  send: ({
    content,
    chatId,
    file,
  }: {
    content: string
    chatId: number | null
    file: File | null
  }) => {
    const form = new FormData()
    form.append('file', file ?? '')
    form.append(
      'data',
      new Blob([JSON.stringify({ content, userId: ADMIN_USER_ID, chatId: chatId ?? undefined })], {
        type: 'application/json',
      }),
    )
    return api.post('/v1/feedback/send', form)
  },
}
