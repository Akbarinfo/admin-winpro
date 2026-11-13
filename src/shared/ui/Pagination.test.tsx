import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('shows the visible range', () => {
    render(<Pagination page={2} size={20} total={57} onChange={vi.fn()} />)
    expect(screen.getByText('21–40 из 57')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Страница 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('moves between pages', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} size={20} total={57} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Следующая страница' }))
    expect(onChange).toHaveBeenLastCalledWith({ page: 3, size: 20 })
    await userEvent.click(screen.getByRole('button', { name: 'Страница 1' }))
    expect(onChange).toHaveBeenLastCalledWith({ page: 1, size: 20 })
  })

  it('goes back to page 1 when the page size changes', async () => {
    const onChange = vi.fn()
    render(<Pagination page={3} size={20} total={200} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), '50')
    expect(onChange).toHaveBeenLastCalledWith({ page: 1, size: 50 })
  })

  it('disables prev/next at the ends and hides page buttons for a single page', () => {
    const { rerender } = render(<Pagination page={3} size={20} total={57} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeDisabled()
    rerender(<Pagination page={1} size={20} total={5} onChange={vi.fn()} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.getByText('1–5 из 5')).toBeInTheDocument()
  })

  it('offers a page number field when there are many pages', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<Pagination page={1} size={10} total={100} onChange={onChange} />)
    // ten pages: buttons are enough
    expect(screen.queryByLabelText('Перейти:')).not.toBeInTheDocument()
    rerender(<Pagination page={1} size={10} total={1000} onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Перейти:'), '37{Enter}')
    expect(onChange).toHaveBeenLastCalledWith({ page: 37, size: 10 })
    // kept within the pages there are; letters are ignored
    await userEvent.type(screen.getByLabelText('Перейти:'), '5x00{Enter}')
    expect(onChange).toHaveBeenLastCalledWith({ page: 100, size: 10 })
    expect(screen.getByLabelText('Перейти:')).toHaveValue('')
  })
})
