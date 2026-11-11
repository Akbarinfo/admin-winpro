import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { MessageSquare, RefreshCw, UserRound } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Alert, Card, IconButton, PageHeader, Spinner } from '@/shared/ui'
import { feedbackApi, feedbackKeys } from './api'
import { ChatView } from './ChatView'

/**
 * Conversations with the app's users (the old pages/feedback.js): who wrote on the left,
 * the chosen conversation on the right. The open one is in the URL (?chat=<userId>).
 */
export function FeedbackPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const selected = Number(searchParams.get('chat')) || null
  // Choosing a user asks for the conversation again (new messages), as the old page did on every click.
  const open = (userId: number | null) => {
    if (userId !== null)
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.messages(userId) })
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (userId === null) next.delete('chat')
        else next.set('chat', String(userId))
        return next
      },
      { replace: true },
    )
  }

  const chats = useQuery({
    queryKey: feedbackKeys.chats,
    queryFn: ({ signal }) => feedbackApi.chats(signal),
  })
  const chosen = chats.data?.find((c) => c.userId === selected)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={t('feedback.title')} />

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Below lg one pane at a time: the list, or the open conversation. */}
        <Card
          className={cn(
            'flex min-h-0 flex-col overflow-hidden',
            selected !== null && 'max-lg:hidden',
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-line py-2 pr-2 pl-3.5">
            <h2 className="font-semibold">{t('feedback.chats')}</h2>
            <IconButton
              label={t('feedback.refresh')}
              // The list and the open conversation: there is no live update.
              onClick={() => queryClient.invalidateQueries({ queryKey: feedbackKeys.all })}
              disabled={chats.isFetching}
            >
              <RefreshCw size={16} className={cn(chats.isFetching && 'animate-spin')} />
            </IconButton>
          </div>
          {chats.isPending ? (
            <div className="grid place-items-center py-10 text-primary">
              <Spinner />
            </div>
          ) : chats.error ? (
            <div className="p-3">
              <Alert>{t('common.load_error')}</Alert>
            </div>
          ) : chats.data.length === 0 ? (
            <p className="p-4 text-muted">{t('feedback.empty_chats')}</p>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto p-1">
              {chats.data.map((chat) => {
                const active = chat.userId === selected
                const unread = chat.notification ?? 0
                return (
                  <li key={chat.id}>
                    <button
                      type="button"
                      aria-current={active || undefined}
                      onClick={() => open(chat.userId)}
                      className={cn(
                        // relative: keeps the sr-only unread text (absolute) inside the scrolling list, not stretching the page.
                        'relative flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left',
                        active ? 'bg-primary-soft text-primary-strong' : 'hover:bg-primary-soft/60',
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
                        <UserRound size={16} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {chat.userName || `ID ${chat.userId}`}
                      </span>
                      {unread > 0 && (
                        <>
                          <span
                            aria-hidden="true"
                            className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-fg tabular-nums"
                          >
                            {unread}
                          </span>
                          <span className="sr-only">{t('feedback.unread', { count: unread })}</span>
                        </>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card
          className={cn(
            'flex min-h-0 flex-col overflow-hidden',
            selected === null && 'max-lg:hidden',
          )}
        >
          {selected === null ? (
            <div className="grid flex-1 place-items-center p-6 text-center text-muted">
              <div className="grid justify-items-center gap-2">
                <MessageSquare size={28} className="text-faint" aria-hidden="true" />
                {t('feedback.choose')}
              </div>
            </div>
          ) : (
            <ChatView
              key={selected}
              userId={selected}
              userName={chosen?.userName ?? `ID ${selected}`}
              onBack={() => open(null)}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
