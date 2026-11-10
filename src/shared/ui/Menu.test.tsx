import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Menu } from './Menu'

const setup = () => {
  const product = vi.fn()
  const price = vi.fn()
  render(
    <Menu
      label="Экспорт"
      items={[
        { key: 'product', label: 'Товары', onSelect: product },
        { key: 'price', label: 'Цены', onSelect: price },
      ]}
    />,
  )
  return { product, price }
}

describe('Menu', () => {
  it('opens, picks an item and closes', async () => {
    const { price } = setup()
    const button = screen.getByRole('button', { name: 'Экспорт' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(button)
    expect(screen.getByRole('menu', { name: 'Экспорт' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Цены' }))
    expect(price).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('works from the keyboard', async () => {
    const { price } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Экспорт' }))
    expect(screen.getByRole('menuitem', { name: 'Товары' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Цены' })).toHaveFocus()
    await userEvent.keyboard('{Home}{ArrowDown}{Enter}')
    expect(price).toHaveBeenCalledOnce()
    // focus goes back to the button (a dialog the item opens returns it there)
    expect(screen.getByRole('button', { name: 'Экспорт' })).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: 'Экспорт' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Экспорт' })).toHaveFocus()
  })
})
