import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { languageRoutes } from './index'

// The real languageApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const RU = { code: 'ru', name: 'Русский', default: true, active: true }
const KK = { code: 'kk', name: 'Қазақша', default: false, active: false }

const renderLanguages = (url = '/languages') =>
  renderWithProviders(<></>, { url, routes: languageRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/language') return { data: [RU, KK] }
    if (url === '/v1/language/ru') return { data: RU }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockResolvedValue({ data: {} })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Languages', () => {
  it('lists all languages from one request, without paging', async () => {
    renderLanguages()
    const ru = (await screen.findByText('Русский')).closest('tr')!
    expect(within(ru).getByText('По умолчанию')).toBeInTheDocument()
    expect(within(ru).getByText('Активен')).toBeInTheDocument()
    expect(
      within(screen.getByText('Қазақша').closest('tr')!).getByText('Выключен'),
    ).toBeInTheDocument()
    expect(http.post).not.toHaveBeenCalled()
    expect(screen.queryByRole('navigation', { name: 'Страницы' })).not.toBeInTheDocument()
  })

  it('deletes by code', async () => {
    renderLanguages()
    const row = (await screen.findByText('Қазақша')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('«Қазақша (kk)» будет удалено')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/language/kk'))
  })

  it('creates with POST and the field «default», as the old panel did', async () => {
    renderLanguages('/languages/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить язык' })
    await userEvent.type(within(dialog).getByLabelText(/Код/), 'en')
    await userEvent.type(within(dialog).getByLabelText(/Название/), 'English')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/language', {
        code: 'en',
        name: 'English',
        default: false,
        active: true,
      }),
    )
  })

  it('edits with PUT on the code and the field «isDefault»; the code is read-only', async () => {
    renderLanguages('/languages/update/ru')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить язык' })
    const code = await within(dialog).findByLabelText(/Код/)
    await waitFor(() => expect(code).toHaveValue('ru'))
    expect(code).toHaveAttribute('readonly')

    await userEvent.click(within(dialog).getByLabelText('Активен'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/language/ru', {
        name: 'Русский',
        isDefault: true,
        active: false,
      }),
    )
  })

  it('requires code and name', async () => {
    renderLanguages('/languages/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)
  })
})
