import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { akfaRoutes } from './index'

// The real akfaApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const KG = {
  id: 1,
  akfaUnitId: 11,
  akfaUnitName: 'Kg',
  unitId: 3,
  unitName: 'Килограмм',
  unitShortName: 'кг',
}
const SQM = { id: 2, akfaUnitId: 12, akfaUnitName: 'sq.m', unitId: null }

const renderUnits = (url = '/integrations/unit') =>
  renderWithProviders(<></>, { url, routes: akfaRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/akfa/unit-mappings') return { data: [KG, SQM] }
    if (url === '/v1/unit/list')
      return {
        data: [
          { id: 3, name: 'Килограмм', shortName: 'кг' },
          { id: 4, name: 'Квадратный метр', shortName: 'м²' },
        ],
      }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockResolvedValue({ data: {} })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Akfa unit mappings', () => {
  it('lists the mappings and warns about the units without a WinPro unit', async () => {
    renderUnits()
    const kg = (await screen.findByText('Kg')).closest('tr')!
    expect(kg).toHaveTextContent('Килограмм (кг)')
    expect(within(screen.getByText('sq.m').closest('tr')!).getByText('Не выбрано')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Единиц AKFA без сопоставления: 1')
  })

  it('deletes by id', async () => {
    renderUnits()
    const row = (await screen.findByText('Kg')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Kg → Килограмм')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/akfa/unit-mappings/1'))
  })

  it('creates with POST, the WinPro unit optional', async () => {
    renderUnits('/integrations/unit/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить сопоставление единицы' })
    await userEvent.type(within(dialog).getByLabelText(/AKFA ID/), '15')
    await userEvent.type(within(dialog).getByLabelText(/Название в AKFA/), '  Штука ')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/akfa/unit-mappings', {
        akfaUnitId: 15,
        akfaUnitName: 'Штука',
        unitId: null,
      }),
    )
  })

  it('edits the record from the list with PUT, its id in the body too', async () => {
    renderUnits('/integrations/unit/update/2')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить сопоставление единицы' })
    await waitFor(() =>
      expect(within(dialog).getByLabelText(/Название в AKFA/)).toHaveValue('sq.m'),
    )
    // no GET by id: the dialog took its record from the list's one request
    expect(http.get.mock.calls.filter(([u]) => u === '/v1/akfa/unit-mappings')).toHaveLength(1)

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Единица WinPro' }))
    await userEvent.click(await screen.findByRole('option', { name: /Квадратный метр/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/akfa/unit-mappings/2', {
        id: 2,
        akfaUnitId: 12,
        akfaUnitName: 'sq.m',
        unitId: 4,
      }),
    )
  })

  it('requires the Akfa id and name', async () => {
    renderUnits('/integrations/unit/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)
    expect(http.post).not.toHaveBeenCalled()
  })
})
