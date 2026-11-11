import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, CheckCheck, ImagePlus, SendHorizontal } from 'lucide-react'
import { isClientError } from '@/shared/api/errors'
import { fileUrl } from '@/shared/api/files'
import { cn } from '@/shared/lib/cn'
import { formatDateTime } from '@/shared/lib/format'
import { Alert, Button, IconButton, Spinner } from '@/shared/ui'
import { ADMIN_USER_ID, feedbackApi, feedbackKeys } from './api'
import { ImageMessageDialog } from './ImageMessageDialog'
import type { FeedbackMessage } from './types'

/** One conversation: the messages, newest at the bottom, and a box to answer. */
export function ChatView({
  userId,
  userName,
  onBack,
}: {
  userId: number
  userName: string
  onBack: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [imageDialog, setImageDialog] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const messages = useQuery({
    queryKey: feedbackKeys.messages(userId),
    queryFn: ({ signal }) => feedbackApi.messages(userId, signal),
  })
  // The conversation's id travels with its messages (the old page took the first one's).
  const chatId = messages.data?.[0]?.chatId ?? null

  const send = useMutation({
    mutationFn: feedbackApi.send,
    onSuccess: async () => {
      // The list too: its unread counts may change.
      await queryClient.invalidateQueries({ queryKey: feedbackKeys.all })
    },
  })

  // Keep the newest message in view.
  useEffect(() => {
    // Only this box: scrollIntoView would also scroll <main> and the page, pushing the header away.
    const box = scrollerRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [messages.data])

  const sendText = () => {
    const content = text.trim()
    if (!content || send.isPending) return
    send.mutate({ content, chatId, file: null }, { onSuccess: () => setText('') })
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-line p-2">
        <IconButton label={t('feedback.back')} onClick={onBack} className="lg:hidden">
          <ArrowLeft size={16} />
        </IconButton>
        <h2 className="min-w-0 flex-1 truncate pl-1.5 font-semibold">{userName}</h2>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto bg-surface-2 px-4 py-3">
        {messages.isPending ? (
          <div className="grid h-full place-items-center text-primary">
            <Spinner />
          </div>
        ) : messages.error ? (
          <Alert>{t('common.load_error')}</Alert>
        ) : messages.data.length === 0 ? (
          <p className="grid h-full place-items-center text-muted">{t('feedback.empty_chat')}</p>
        ) : (
          <ol className="grid gap-3" aria-label={t('feedback.title')}>
            {messages.data.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </ol>
        )}
      </div>

      {/* A 4xx is the user's to see here; 5xx and network errors are toasted by the API client. */}
      {isClientError(send.error) && !imageDialog && (
        <div className="px-3 pt-2">
          <Alert>{send.error.message}</Alert>
        </div>
      )}
      <form
        className="flex items-end gap-2 border-t border-line p-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          sendText()
        }}
      >
        <IconButton label={t('feedback.send_image')} bordered onClick={() => setImageDialog(true)}>
          <ImagePlus size={16} />
        </IconButton>
        <textarea
          aria-label={t('feedback.message')}
          placeholder={t('feedback.placeholder')}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          // Enter sends, Shift+Enter starts a new line.
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              sendText()
            }
          }}
          className="max-h-32 min-h-9 flex-1 resize-none rounded-md border border-line-strong bg-surface px-3 py-1.5 outline-none [field-sizing:content] placeholder:text-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)]"
        />
        <Button
          type="submit"
          aria-label={t('feedback.send')}
          title={t('feedback.send')}
          loading={send.isPending}
          disabled={!text.trim()}
          icon={<SendHorizontal size={16} />}
        />
      </form>

      {imageDialog && (
        <ImageMessageDialog
          onClose={() => setImageDialog(false)}
          onSend={(file, caption) => send.mutateAsync({ content: caption, chatId, file })}
        />
      )}
    </>
  )
}

/** The admin's messages on the right, the user's on the left with their name. */
function MessageBubble({ message: m }: { message: FeedbackMessage }) {
  const { t } = useTranslation()
  const mine = m.userId === ADMIN_USER_ID
  return (
    <li className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      {!mine && m.sender && <span className="px-1 text-xs font-medium text-muted">{m.sender}</span>}
      <div
        className={cn(
          'max-w-[min(32rem,85%)] overflow-hidden rounded-xl',
          mine
            ? 'rounded-br-sm bg-primary text-primary-fg'
            : 'rounded-bl-sm border border-line bg-surface',
        )}
      >
        {m.imgId != null && (
          <a
            href={fileUrl('message/img', m.imgId)}
            target="_blank"
            rel="noreferrer"
            title={t('feedback.open_image')}
          >
            <img
              src={fileUrl('message/img', m.imgId)}
              alt={m.content || t('feedback.image')}
              loading="lazy"
              className="max-h-72 w-full object-cover"
            />
          </a>
        )}
        <div className="grid gap-0.5 px-3 py-1.5">
          {m.content && <p className="break-words whitespace-pre-wrap">{m.content}</p>}
          <span
            className={cn(
              'flex items-center justify-end gap-1 text-[11.5px] tabular-nums',
              mine ? 'text-primary-fg/80' : 'text-faint',
            )}
          >
            {formatDateTime(m.sendDate)}
            {mine &&
              (m.isChecked ? (
                <CheckCheck size={14} aria-label={t('feedback.read')} />
              ) : (
                <Check size={14} aria-label={t('feedback.delivered')} />
              ))}
          </span>
        </div>
      </div>
    </li>
  )
}
