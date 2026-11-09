import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { seriesRoutes } from './index'

// The real API runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const A = { id: 3, name: 'Akfa 60', description: 'Профиль 60 мм' }
const B = { id: 4, name: 'Rehau', description: null }

const renderPage = (url = '/series') => renderWithProviders(<></>, { url, routes: seriesRoutes })
const lastTableBody = () =>
  http.post.mock.calls.filter(([url]) => url === '/v1/product/series/table').at(-1)?.[1]

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/product/series/table'
      ? { data: { data: [A, B], recordsTotal: 2, recordsFiltered: 2 } }
      : { data: {} },
  )
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/product/series/3') return { data: A }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('series', () => {
  it('lists records from the table endpoint', async () => {
    renderPage()
    expect(await screen.findByText('Профиль 60 мм')).toBeInTheDocument()
    expect(lastTableBody()).toMatchObject({ start: 0, length: 20, search: { value: '' } })
  })

  it('searches and sorts by description', async () => {
    renderPage()
    await screen.findByText('Akfa 60')
    await userEvent.type(screen.getByRole('searchbox'), 'akfa')
    await waitFor(() => expect(lastTableBody()).toMatchObject({ search: { value: 'akfa' } }))
    await userEvent.click(screen.getByRole('button', { name: /Описание/ }))
    await waitFor(() =>
      expect(lastTableBody()).toMatchObject({ order: [{ column: 'description', dir: 'ASC' }] }),
    )
  })

  it('deletes after confirmation', async () => {
    renderPage()
    const row = (await screen.findByText('Rehau')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/product/series/4'))
  })

  it('creates with the same body as the old panel (description optional)', async () => {
    renderPage('/series/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить серию' })
    await userEvent.type(within(dialog).getByLabelText(/Название/), ' Engelberg ')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/product/series', {
        id: null,
        name: 'Engelberg',
        description: '',
      }),
    )
  })

  it('requires a name', async () => {
    renderPage('/series/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(1)
  })

  it('edits with PUT', async () => {
    renderPage('/series/update/3')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить серию' })
    const description = await within(dialog).findByLabelText(/Описание/)
    await waitFor(() => expect(description).toHaveValue('Профиль 60 мм'))
    await userEvent.clear(description)
    await userEvent.type(description, 'Новый')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/product/series', {
        id: '3',
        name: 'Akfa 60',
        description: 'Новый',
      }),
    )
  })
})
