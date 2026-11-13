import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

type Question = {
  title: ReactNode
  description: ReactNode
  confirmLabel: string
  tone?: 'danger' | 'primary'
}

/**
 * Asks a question and waits for the answer — for steps one after another (the old `await swal()`):
 *
 *   const confirm = useConfirm()
 *   if (!(await confirm.ask({ title, description, confirmLabel }))) return
 *   …
 *   {confirm.dialog}
 */
export function useConfirm() {
  const [question, setQuestion] = useState<Question | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)
  // Gone while asking (e.g. another tab opened): the question counts as «no», so the code
  // waiting for it finishes (and refreshes what it changed) instead of hanging.
  useEffect(() => () => resolver.current?.(false), [])

  const answer = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setQuestion(null)
  }

  return {
    ask: (q: Question) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false) // a question still open counts as «no»
        resolver.current = resolve
        setQuestion(q)
      }),
    dialog: question && (
      <ConfirmDialog
        open
        title={question.title}
        description={question.description}
        confirmLabel={question.confirmLabel}
        tone={question.tone ?? 'primary'}
        onConfirm={() => answer(true)}
        onCancel={() => answer(false)}
      />
    ),
  }
}
