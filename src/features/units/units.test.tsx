import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { unitRoutes } from './index'

// The real unitApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const METER = { id: 7, name: 'Метр', shortName: 'м' }
const PIECE = { id: 9, name: 'Штука', shortName: 'шт' }

const renderUnits = (url = '/units') => renderWithProviders(<></>, { url, routes: unitRoutes })
const lastTableBody = () =>
  http.post.mock.calls.filter(([url]) => url === '/v1/unit/table').at(-1)?.[1]

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/unit/table'
      ? { data: { data: [METER, PIECE], recordsTotal: 42, recordsFiltered: 42 } }
      : { data: {} },
  )
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/unit/7') return { data: METER }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Units', () => {
  it('lists units with row numbers that continue across pages', async () => {
    renderUnits('/units?units.page=2')
    const row = (await screen.findByText('Метр')).closest('tr')!
    expect(within(row).getByText('21')).toBeInTheDocument() // page 2, size 20
    expect(lastTableBody()).toMatchObject({ start: 20, length: 20 })
  })

  it('searches after typing stops', async () => {
    renderUnits()
    await screen.findByText('Метр')
    await userEvent.type(screen.getByRole('searchbox'), 'шт')
    await waitFor(() =>
      expect(lastTableBody()).toMatchObject({ start: 0, search: { value: 'шт', regex: true } }),
    )
    // the found text is marked in the table
    await waitFor(() => expect(screen.getByText('шт', { selector: 'mark' })).toBeInTheDocument())
  })

  it('sorts the abbreviation by the old header key «short_name»', async () => {
    renderUnits()
    await screen.findByText('Метр')
    await userEvent.click(screen.getByRole('button', { name: /Сокращение/ }))
    await waitFor(() =>
      expect(lastTableBody()).toMatchObject({ order: [{ column: 'short_name', dir: 'ASC' }] }),
    )
  })

  it('deletes after confirmation', async () => {
    renderUnits()
    const row = (await screen.findByText('Штука')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('«Штука (шт)» будет удалено')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/unit/9'))
  })

  it('creates a unit with the same body as the old panel', async () => {
    renderUnits('/units/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить единицу' })
    await userEvent.type(within(dialog).getByLabelText(/Название/), 'Килограмм')
    await userEvent.type(within(dialog).getByLabelText(/Сокращение/), 'кг')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/unit', {
        id: null,
        name: 'Килограмм',
        shortName: 'кг',
      }),
    )
  })

  it('requires both fields', async () => {
    renderUnits('/units/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)
  })

  it('edits with PUT', async () => {
    renderUnits('/units/update/7')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить единицу' })
    const short = await within(dialog).findByLabelText(/Сокращение/)
    await waitFor(() => expect(short).toHaveValue('м'))
    await userEvent.clear(short)
    await userEvent.type(short, 'пог. м')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/unit', {
        id: '7',
        name: 'Метр',
        shortName: 'пог. м',
      }),
    )
  })
})
