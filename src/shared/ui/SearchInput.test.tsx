import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('applies the search once, after typing stops', async () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} delay={50} />)
    await userEvent.type(screen.getByRole('searchbox'), 'рама')
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('рама'))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('ignores a single character, as the old panel did', async () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} delay={20} />)
    await userEvent.type(screen.getByRole('searchbox'), 'р')
    await new Promise((r) => setTimeout(r, 60))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clears the search with the × button', async () => {
    const onChange = vi.fn()
    render(<SearchInput value="usd" onChange={onChange} delay={20} />)
    expect(screen.getByRole('searchbox')).toHaveValue('usd')
    await userEvent.click(screen.getByRole('button', { name: 'Очистить' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(''))
  })

  it('shows a value applied from outside (Back button)', () => {
    const { rerender } = render(<SearchInput value="" onChange={vi.fn()} />)
    rerender(<SearchInput value="eur" onChange={vi.fn()} />)
    expect(screen.getByRole('searchbox')).toHaveValue('eur')
  })
})
