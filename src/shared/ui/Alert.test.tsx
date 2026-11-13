import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from './Alert'

describe('Alert', () => {
  it('reads as an alert, with a bold title above the text', () => {
    render(
      <Alert tone="info" title="Заказ возвращён">
        Причина: неверные размеры створки.
      </Alert>,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Заказ возвращён')
    expect(alert).toHaveTextContent('Причина: неверные размеры створки.')
  })

  it('without a title shows just the text', () => {
    render(<Alert tone="ok">Цены обновлены.</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent(/^Цены обновлены\.$/)
  })
})
