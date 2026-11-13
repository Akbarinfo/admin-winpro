import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Tabs } from './Tabs'

type Tab = 'spec' | 'acc' | 'fill'

function Harness() {
  const [tab, setTab] = useState<Tab>('spec')
  return (
    <Tabs
      id="t"
      label="Разделы"
      value={tab}
      onChange={setTab}
      items={[
        { value: 'spec', label: 'Спецификация', count: 8 },
        { value: 'acc', label: 'Фурнитура', count: 0 },
        { value: 'fill', label: 'Заполнение' },
      ]}
    >
      <p>Панель {tab}</p>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('shows the chosen tab’s panel and switches on click', async () => {
    render(<Harness />)
    expect(screen.getByRole('tab', { name: 'Спецификация 8' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    // a zero is still a count
    expect(screen.getByRole('tab', { name: 'Фурнитура 0' })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel', { name: 'Спецификация 8' })).toHaveTextContent(
      'Панель spec',
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Заполнение' }))
    expect(screen.getByRole('tabpanel', { name: 'Заполнение' })).toHaveTextContent('Панель fill')
  })

  it('moves and chooses with the arrows, Home and End, with one Tab stop', async () => {
    render(<Harness />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1])

    tabs[0].focus()
    await userEvent.keyboard('{ArrowLeft}') // wraps round to the last
    expect(tabs[2]).toHaveFocus()
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowRight}')
    expect(tabs[0]).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByText('Панель fill')).toBeInTheDocument()
    await userEvent.keyboard('{Home}')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('puts buttons on the right of the tab row, outside the tab list', () => {
    render(
      <Tabs
        id="a"
        label="Разделы"
        value="x"
        onChange={() => {}}
        items={[{ value: 'x', label: 'Икс' }]}
        aside={<button>Маппинг</button>}
      >
        <p>Панель</p>
      </Tabs>,
    )
    const button = screen.getByRole('button', { name: 'Маппинг' })
    expect(screen.getByRole('tablist')).not.toContainElement(button)
    expect(screen.getByRole('tabpanel')).not.toContainElement(button)
  })
})
