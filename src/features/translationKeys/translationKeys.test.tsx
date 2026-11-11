import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { renderWithProviders } from '@/test/render'
import { translationRoutes } from './index'

// The real translationApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
const http = vi.mocked(api)

const ROWS = [
  {
    key: 'char.depth',
    translations: [
      { code: 'ru', value: 'Глубина' },
      { code: 'uz', value: 'Chuqurlik' },
    ],
  },
  // no Uzbek text yet
  { key: 'door/left side', translations: [{ code: 'ru', value: 'Левая сторона' }] },
]
const LANGUAGES = [
  { code: 'ru', name: 'Русский', active: true, default: true },
  { code: 'uz', name: 'Oʻzbekcha', active: true, default: false },
  { code: 'en', name: 'English', active: false, default: false },
]

const tableBodies = () =>
  http.post.mock.calls.filter(([u]) => u === '/v1/translation/table').map(([, body]) => body)
const render = (url = '/translations') =>
  renderWithProviders(<></>, { url, routes: translationRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/translation/table'
      ? { data: { data: ROWS, total: 23, totalPage: 3 } }
      : { data: {} },
  )
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/language') return { data: LANGUAGES }
    if (url === '/v1/translation/by-key/door%2Fleft%20side') return { data: ROWS[1] }
    throw new Error(`unexpected GET ${url}`)
  })
})

describe('Translations', () => {
  it('lists keys with a column per active language, page 1-based, by key descending', async () => {
    render()
    expect(await screen.findByText('Глубина')).toBeInTheDocument()
    expect(tableBodies()[0]).toEqual({
      page: 1,
      size: 10,
      order: [{ column: 'key', dir: 'DESC' }],
      filter: {},
    })
    expect(screen.getByRole('columnheader', { name: 'Oʻzbekcha' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'English' })).not.toBeInTheDocument()
    const row = screen.getByText('door/left side').closest('tr')!
    expect(row).toHaveTextContent('—')
    expect(screen.getByText(/из 23/)).toBeInTheDocument()
  })

  it('searches, sorts and pages in the URL', async () => {
    const { router } = render()
    await screen.findByText('Глубина')
    await userEvent.type(screen.getByRole('searchbox'), 'глуб')
    await waitFor(() =>
      expect(tableBodies().at(-1)).toMatchObject({ page: 1, filter: { query: 'глуб' } }),
    )
    await userEvent.click(screen.getByRole('button', { name: /Ключ/ }))
    await waitFor(() =>
      expect(tableBodies().at(-1)).toMatchObject({ order: [{ column: 'key', dir: 'ASC' }] }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Следующая страница' }))
    await waitFor(() => expect(tableBodies().at(-1)).toMatchObject({ page: 2 }))
    expect(router.state.location.search).toContain('translations.q=')
  })

  it('adds a key with a text in every active language', async () => {
    const { router } = render('/translations/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(await within(dialog).findByLabelText(/^Ключ/), '  window.tilt  ')
    await userEvent.type(within(dialog).getByLabelText(/^Русский/), 'Откидное')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    // every language is required
    expect(within(dialog).getByText('Заполните это поле')).toBeInTheDocument()
    expect(http.post).not.toHaveBeenCalledWith('/v1/translation', expect.anything())

    await userEvent.type(within(dialog).getByLabelText(/^Oʻzbekcha/), 'Ochiladigan')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/translation', {
        key: 'window.tilt',
        translations: [
          { code: 'ru', value: 'Откидное' },
          { code: 'uz', value: 'Ochiladigan' },
        ],
      }),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/translations'))
  })

  it('edits a key: the key is locked, the texts go by PUT to its encoded URL', async () => {
    render()
    const row = (await screen.findByText('door/left side')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() =>
      expect(within(dialog).getByLabelText(/^Русский/)).toHaveValue('Левая сторона'),
    )
    expect(within(dialog).getByLabelText(/^Ключ/)).toBeDisabled()
    await userEvent.type(within(dialog).getByLabelText(/^Oʻzbekcha/), 'Chap tomon')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/translation/door%2Fleft%20side', {
        translations: [
          { code: 'ru', value: 'Левая сторона' },
          { code: 'uz', value: 'Chap tomon' },
        ],
      }),
    )
  })

  it('deletes a key by its encoded URL', async () => {
    render()
    const row = (await screen.findByText('door/left side')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Удалить' }),
    )
    await waitFor(() =>
      expect(http.delete).toHaveBeenCalledWith('/v1/translation/door%2Fleft%20side'),
    )
  })

  it('imports Excel and tells why rows were refused', async () => {
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/translation/import-excel')
        return { data: { success: 2, failed: 1, errors: ['Строка 4: пустой ключ'] } }
      return { data: { data: ROWS, total: 2 } }
    })
    render()
    await screen.findByText('Глубина')
    await userEvent.click(screen.getByRole('button', { name: 'Импорт Excel' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('button', { name: 'Скачать шаблон' })).not.toBeInTheDocument()
    const file = new File(['x'], 'translations.xlsx')
    await userEvent.upload(within(dialog).getByLabelText('Файл Excel'), file)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Загрузить' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Строка 4: пустой ключ'))
    expect(toast.success).toHaveBeenCalledWith('Файл загружен')
    const [, body] = http.post.mock.calls.find(([u]) => u === '/v1/translation/import-excel')!
    expect((body as FormData).get('file')).toBe(file)
  })

  it('exports Excel as translations.xlsx', async () => {
    const blob = new Blob(['xlsx'])
    http.get.mockImplementation(async (url: string) => {
      if (url === '/v1/language') return { data: LANGUAGES }
      if (url === '/v1/translation/export-excel') return { data: blob }
      throw new Error(`unexpected GET ${url}`)
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    render()
    await screen.findByText('Глубина')
    await userEvent.click(screen.getByRole('button', { name: 'Экспорт Excel' }))
    await waitFor(() => expect(click).toHaveBeenCalled())
    expect(http.get).toHaveBeenCalledWith('/v1/translation/export-excel', { responseType: 'blob' })
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('translations.xlsx')
    click.mockRestore()
  })

  it('asks for a text in a language the key has none in yet', async () => {
    render('/translations/update/door%2Fleft%20side')
    const dialog = await screen.findByRole('dialog')
    await waitFor(() =>
      expect(within(dialog).getByLabelText(/^Русский/)).toHaveValue('Левая сторона'),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findByText('Заполните это поле')).toBeInTheDocument()
    expect(http.put).not.toHaveBeenCalled()
  })

  it('keeps the import dialog with the reason when the backend refuses the file', async () => {
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/translation/import-excel') throw new ApiError(400, 'Неверный формат файла')
      return { data: { data: ROWS, total: 2 } }
    })
    render()
    await screen.findByText('Глубина')
    await userEvent.click(screen.getByRole('button', { name: 'Импорт Excel' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.upload(within(dialog).getByLabelText('Файл Excel'), new File(['x'], 'tr.xlsx'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Загрузить' }))
    expect(await within(dialog).findByText('Неверный формат файла')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
