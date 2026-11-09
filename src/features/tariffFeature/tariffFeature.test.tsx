import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { tariffFeatureRoutes } from './index'

// The real API runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const FEATURE = {
  id: 4,
  tariff: 'PRO',
  featureKey: 'max_orders',
  featureLabel: 'Заказов в месяц',
  value: '500',
  featureType: 'TEXT',
  unit: 'шт',
  sortOrder: 2,
}

const renderPage = (url = '/tariff-feature') =>
  renderWithProviders(<></>, { url, routes: tariffFeatureRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/tariff-feature/list') return { data: [FEATURE] }
    if (url === '/v1/tariff-feature/4') return { data: FEATURE }
    if (url === '/v1/tariff-price/tariffs') return { data: ['BASIC', 'PRO'] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockResolvedValue({ data: {} })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Tariff features', () => {
  it('lists all features from /list', async () => {
    renderPage()
    const row = (await screen.findByText('Заказов в месяц')).closest('tr')!
    expect(within(row).getByText('PRO')).toBeInTheDocument()
    expect(within(row).getByText('max_orders')).toBeInTheDocument()
  })

  it('creates without an id', async () => {
    renderPage('/tariff-feature/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить функцию тарифа' })
    await userEvent.click(within(dialog).getByLabelText(/Тариф/))
    await userEvent.click(within(dialog).getByRole('option', { name: 'BASIC' }))
    await userEvent.selectOptions(within(dialog).getByLabelText(/Тип функции/), 'BOOLEAN')
    await userEvent.type(within(dialog).getByLabelText(/Ключ функции/), 'export_pdf')
    await userEvent.type(within(dialog).getByLabelText(/Название функции/), 'Экспорт в PDF')
    await userEvent.type(within(dialog).getByLabelText(/Значение/), 'true')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/tariff-feature', {
        tariff: 'BASIC',
        featureKey: 'export_pdf',
        featureLabel: 'Экспорт в PDF',
        value: 'true',
        featureType: 'BOOLEAN',
        unit: '',
        sortOrder: 0,
      }),
    )
  })

  it('edits with PUT and the id at the end of the body', async () => {
    renderPage('/tariff-feature/update/4')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить функцию тарифа' })
    const value = await within(dialog).findByLabelText(/Значение/)
    await waitFor(() => expect(value).toHaveValue('500'))
    await userEvent.clear(value)
    await userEvent.type(value, '1000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/tariff-feature', {
        tariff: 'PRO',
        featureKey: 'max_orders',
        featureLabel: 'Заказов в месяц',
        value: '1000',
        featureType: 'TEXT',
        unit: 'шт',
        sortOrder: 2,
        id: '4',
      }),
    )
  })

  it('requires tariff, type, key, label and value', async () => {
    renderPage('/tariff-feature/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(5)
  })

  it('deletes after confirmation', async () => {
    renderPage()
    const row = (await screen.findByText('Заказов в месяц')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/tariff-feature/4'))
  })
})
