import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { NumberInput } from './NumberInput'

function Harness({
  onChange,
  initial = null,
  nonNegative,
  minDecimals,
}: {
  onChange: (v: number | null) => void
  initial?: number | null
  nonNegative?: boolean
  minDecimals?: number
}) {
  const [value, setValue] = useState<number | null>(initial)
  return (
    <>
      <NumberInput
        aria-label="rate"
        value={value}
        nonNegative={nonNegative}
        minDecimals={minDecimals}
        onChange={(v) => {
          setValue(v)
          onChange(v)
        }}
      />
      <button onClick={() => setValue(42000)}>reset</button>
    </>
  )
}

const input = () => screen.getByLabelText('rate') as HTMLInputElement

describe('NumberInput', () => {
  it('groups thousands with a space while typing', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.type(input(), '15253')
    expect(input()).toHaveValue('15 253')
    expect(onChange).toHaveBeenLastCalledWith(15253)

    await userEvent.type(input(), '00')
    expect(input()).toHaveValue('1 525 300')
  })

  it('uses a comma for decimals, whichever separator is typed', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.type(input(), '12648.5')
    expect(input()).toHaveValue('12 648,5')
    expect(onChange).toHaveBeenLastCalledWith(12648.5)
  })

  it('keeps the caret after the same digit when groups shift', async () => {
    render(<Harness onChange={vi.fn()} initial={1000} />)
    // «1 000» → put the caret after «1» and type «5» → «15 000», caret after «5»
    input().focus()
    input().setSelectionRange(1, 1)
    await userEvent.keyboard('5')
    expect(input()).toHaveValue('15 000')
    expect(input().selectionStart).toBe(2)
  })

  it('backspace over a group space removes the digit before it', async () => {
    render(<Harness onChange={vi.fn()} initial={12345} />)
    input().focus()
    input().setSelectionRange(3, 3) // «12 |345»
    await userEvent.keyboard('{Backspace}')
    expect(input()).toHaveValue('1 345')
  })

  it('ignores letters and blocks minus when nonNegative', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} nonNegative />)
    await userEvent.type(input(), '-1a2')
    expect(input()).toHaveValue('12')
    expect(onChange).toHaveBeenLastCalledWith(12)
  })

  it('reports null when emptied', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} initial={5} />)
    await userEvent.clear(input())
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('pads to minDecimals on blur without cutting digits (dollars: «1,50»)', async () => {
    render(<Harness onChange={vi.fn()} minDecimals={2} />)
    await userEvent.type(input(), '1,5')
    expect(input()).toHaveValue('1,5') // not while typing
    await userEvent.tab()
    expect(input()).toHaveValue('1,50')

    await userEvent.clear(input())
    await userEvent.type(input(), '0,0000721')
    await userEvent.tab()
    expect(input()).toHaveValue('0,0000721')
  })

  it('shows a value set from outside (form reset), formatted', async () => {
    render(<Harness onChange={vi.fn()} initial={1} />)
    await userEvent.click(screen.getByRole('button', { name: 'reset' }))
    expect(input()).toHaveValue('42 000')
  })
})
