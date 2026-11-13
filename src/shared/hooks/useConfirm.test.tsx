import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useConfirm } from './useConfirm'

function Probe({ onAnswer }: { onAnswer: (answers: boolean[]) => void }) {
  const confirm = useConfirm()
  const run = async () => {
    const first = await confirm.ask({ title: 'Первый?', description: 'шаг 1', confirmLabel: 'Да' })
    const second = await confirm.ask({ title: 'Второй?', description: 'шаг 2', confirmLabel: 'Да' })
    onAnswer([first, second])
  }
  return (
    <>
      <button onClick={run}>Начать</button>
      {confirm.dialog}
    </>
  )
}

describe('useConfirm', () => {
  it('asks one question after another and gives the answers', async () => {
    const onAnswer = vi.fn()
    render(<Probe onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: 'Начать' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Да' }))
    expect(await screen.findByText('шаг 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }))
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith([true, false]))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('answers «no» when it goes away while asking, or when asked again', async () => {
    const answers: boolean[] = []
    function Asker() {
      const confirm = useConfirm()
      return (
        <>
          <button
            onClick={() =>
              void confirm
                .ask({ title: 'Вопрос?', description: 'д', confirmLabel: 'Да' })
                .then((a) => answers.push(a))
            }
          >
            Спросить
          </button>
          {confirm.dialog}
        </>
      )
    }
    const { unmount } = render(<Asker />)
    await userEvent.click(screen.getByRole('button', { name: 'Спросить' }))
    // asked again while open: the first one is «no»
    await userEvent.click(screen.getByRole('button', { name: 'Спросить' }))
    await waitFor(() => expect(answers).toEqual([false]))
    unmount()
    await waitFor(() => expect(answers).toEqual([false, false]))
  })
})
