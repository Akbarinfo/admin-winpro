import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { workshopServiceRoutes } from './index'

// The real API runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const CUT = {
  id: 12,
  name: 'Резка профиля',
  serviceType: 'CUTTING',
  calculationType: { key: 'PER_METER', value: 'За метр' },
  price: 15000,
  currency: { id: 1, name: 'Узбекский сум', symbol: 'сум' },
}

const renderPage = (url = '/workshop-service') =>
  renderWithProviders(<></>, { url, routes: workshopServiceRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/workshop-service/table'
      ? { data: { data: [CUT], recordsTotal: 1, recordsFiltered: 1 } }
      : { data: {} },
  )
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/workshop-service/12') return { data: CUT }
    if (url === '/v1/workshop-service/service-type')
      return {
        data: [
          { id: 'CUTTING', name: 'Резка' },
          { id: 'WELDING', name: 'Сварка' },
        ],
      }
    if (url === '/v1/workshop-service/calculation-type')
      return {
        data: [
          { key: 'PER_METER', value: 'За метр' },
          { key: 'PER_PIECE', value: 'За штуку' },
        ],
      }
    if (url === '/v1/currency/list')
      return {
        data: [
          { id: 1, name: 'Узбекский сум', symbol: 'сум', isMain: true },
          { id: 2, name: 'Доллар США', symbol: '$' },
        ],
      }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Workshop services', () => {
  it('lists services with type names, calculation and price', async () => {
    renderPage()
    const row = (await screen.findByText('Резка профиля')).closest('tr')!
    expect(within(row).getByText('За метр')).toBeInTheDocument()
    expect(await within(row).findByText('Резка')).toBeInTheDocument()
    expect(within(row).getByText(/15\s000/)).toBeInTheDocument()
  })

  it('creates with the old body: empty calculation type is {}', async () => {
    renderPage('/workshop-service/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить услугу' })
    await userEvent.type(within(dialog).getByLabelText(/Название/), 'Сварка углов')
    await userEvent.click(within(dialog).getByLabelText('Тип услуги'))
    await userEvent.click(within(dialog).getByRole('option', { name: 'Сварка' }))
    await userEvent.type(within(dialog).getByLabelText('Цена'), '2,5')
    await userEvent.click(within(dialog).getByLabelText('Валюта'))
    await userEvent.click(within(dialog).getByRole('option', { name: 'Доллар США ($)' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/workshop-service', {
        id: null,
        name: 'Сварка углов',
        calculationType: {},
        price: 2.5,
        currencyId: 2,
        serviceType: 'WELDING',
      }),
    )
  })

  it('edits with PUT and a numeric id', async () => {
    renderPage('/workshop-service/update/12')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить услугу' })
    await waitFor(() =>
      expect(within(dialog).getByLabelText(/Название/)).toHaveValue('Резка профиля'),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/workshop-service', {
        id: 12,
        name: 'Резка профиля',
        calculationType: { key: 'PER_METER' },
        price: 15000,
        currencyId: 1,
        serviceType: 'CUTTING',
      }),
    )
  })

  it('requires a name', async () => {
    renderPage('/workshop-service/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findByText('Заполните это поле')).toBeInTheDocument()
  })

  it('deletes after confirmation', async () => {
    renderPage()
    const row = (await screen.findByText('Резка профиля')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/workshop-service/12'))
  })
})
