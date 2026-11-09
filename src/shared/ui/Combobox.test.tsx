import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from './Combobox'

type Option = { id: number; name: string }
const OPTIONS: Option[] = [
  { id: 1, name: 'Akfa 60' },
  { id: 2, name: 'Rehau Blitz' },
  { id: 3, name: 'Rehau Grazio' },
]

function Harness({
  onChange = vi.fn(),
  initial = null,
}: {
  onChange?: (v: Option | null) => void
  initial?: Option | null
}) {
  const [value, setValue] = useState<Option | null>(initial)
  return (
    <Combobox
      id="system"
      options={OPTIONS}
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange(v)
      }}
      getKey={(o) => o.id}
      getLabel={(o) => o.name}
      clearable
    />
  )
}

describe('Combobox', () => {
  it('filters options by typed text and selects with a click', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = screen.getByRole('combobox')

    await userEvent.type(input, 'reh')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Rehau Blitz',
      'Rehau Grazio',
    ])

    await userEvent.click(screen.getByRole('option', { name: 'Rehau Grazio' }))
    expect(onChange).toHaveBeenLastCalledWith(OPTIONS[2])
    expect(input).toHaveValue('Rehau Grazio')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('works with the keyboard', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    screen.getByRole('combobox').focus()

    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(OPTIONS[1])

    await userEvent.keyboard('{ArrowDown}{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('says when nothing matches', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox'), 'xyz')
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
  })

  it('clears the value', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} initial={OPTIONS[0]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Очистить' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(screen.getByRole('combobox')).toHaveValue('')
  })
})
