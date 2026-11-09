import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './DataTable'

type Row = { id: number; name: string; rate: number }
const rows: Row[] = [
  { id: 1, name: 'USD', rate: 12648.5 },
  { id: 2, name: 'EUR', rate: 13712.3 },
]
const columns: Column<Row>[] = [
  { key: 'name', title: 'Валюта', sortable: true },
  { key: 'rate', title: 'Курс', align: 'right', render: (r) => `≈ ${r.rate}` },
]

describe('DataTable', () => {
  it('renders raw values and custom cells', () => {
    render(<DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />)
    const body = screen.getAllByRole('rowgroup')[1]
    expect(within(body).getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('≈ 12648.5')).toBeInTheDocument()
  })

  it('shows the empty message when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} getRowKey={(r) => r.id} empty="Курсов нет" />)
    expect(screen.getByText('Курсов нет')).toBeInTheDocument()
  })

  it('shows skeleton rows instead of data while loading', () => {
    render(
      <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} loading skeletonRows={3} />,
    )
    expect(screen.queryByText('USD')).not.toBeInTheDocument()
    expect(within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')).toHaveLength(3)
  })

  it('reports the next sort and marks the active column', async () => {
    const onSortChange = vi.fn()
    const { rerender } = render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        onSortChange={onSortChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Валюта/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'name', dir: 'asc' })

    rerender(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        sort={{ column: 'name', dir: 'asc' }}
        onSortChange={onSortChange}
      />,
    )
    expect(screen.getByRole('columnheader', { name: /Валюта/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    await userEvent.click(screen.getByRole('button', { name: /Валюта/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'name', dir: 'desc' })
  })

  it('sends sortKey instead of key when the backend uses another column name', async () => {
    const onSortChange = vi.fn()
    const cols: Column<Row>[] = [
      { key: 'name', title: 'Валюта', sortable: true, sortKey: 'table.x.name' },
    ]
    render(
      <DataTable
        columns={cols}
        rows={rows}
        getRowKey={(r) => r.id}
        sort={{ column: 'table.x.name', dir: 'asc' }}
        onSortChange={onSortChange}
      />,
    )
    expect(screen.getByRole('columnheader', { name: /Валюта/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    await userEvent.click(screen.getByRole('button', { name: /Валюта/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'table.x.name', dir: 'desc' })
  })

  it('does not make non-sortable columns clickable', () => {
    render(
      <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} onSortChange={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: /Курс/ })).not.toBeInTheDocument()
  })

  it('row actions do not trigger the row click', async () => {
    const onRowClick = vi.fn()
    const onEdit = vi.fn()
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        onRowClick={onRowClick}
        actions={(r) => <button onClick={() => onEdit(r.id)}>edit {r.id}</button>}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'edit 2' }))
    expect(onEdit).toHaveBeenCalledWith(2)
    expect(onRowClick).not.toHaveBeenCalled()

    await userEvent.click(screen.getByText('USD'))
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
  })
})
