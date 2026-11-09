import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MultiSelect } from './MultiSelect'

type Option = { id: string; name: string }
const OPTIONS: Option[] = [
  { id: 'PROFILES', name: 'Профили' },
  { id: 'FITTINGS', name: 'Фурнитура' },
  { id: 'SEAL', name: 'Уплотнения' },
]

function Harness({ onChange }: { onChange: (v: Option[]) => void }) {
  const [value, setValue] = useState<Option[]>([OPTIONS[0]])
  return (
    <MultiSelect
      options={OPTIONS}
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange(v)
      }}
      getKey={(o) => o.id}
      getLabel={(o) => o.name}
    />
  )
}

describe('MultiSelect', () => {
  it('adds and removes options from the list', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: 'Уплотнения' }))
    expect(onChange).toHaveBeenLastCalledWith([OPTIONS[0], OPTIONS[2]])

    await userEvent.click(screen.getByRole('option', { name: 'Профили' }))
    expect(onChange).toHaveBeenLastCalledWith([OPTIONS[2]])
  })

  it('filters by typing and toggles with Enter', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.type(screen.getByRole('combobox'), 'фур{Enter}')
    expect(onChange).toHaveBeenLastCalledWith([OPTIONS[0], OPTIONS[1]])
  })

  it('removes a chip with its × button', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Очистить: Профили' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })
})
