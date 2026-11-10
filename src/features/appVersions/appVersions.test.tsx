import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { appVersionRoutes } from './index'

// The real API runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const ANDROID = {
  platform: 'ANDROID',
  latestVersion: '1.4.2',
  minVersion: '1.2.0',
  forceUpdate: true,
  storeUrl: 'https://play.google.com/store/apps/details?id=uz.winpro',
  releaseNotes: 'Исправления',
  updatedAt: '2026-10-19T14:05:33',
}

const renderPage = (url = '/app-versions') =>
  renderWithProviders(<></>, { url, routes: appVersionRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/app-version/list') return { data: [ANDROID] }
    if (url === '/v1/app-version/platforms') return { data: ['ANDROID', 'IOS'] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockResolvedValue({ data: 'ok' })
})

describe('App versions', () => {
  it('lists one row per platform', async () => {
    renderPage()
    const row = (await screen.findByText('ANDROID')).closest('tr')!
    expect(within(row).getByText('1.4.2')).toBeInTheDocument()
    expect(within(row).getByText('19.10.2026 14:05')).toBeInTheDocument()
    expect(within(row).getByText('Обязательное обновление')).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument()
  })

  it('adds with nulls for empty optional fields', async () => {
    renderPage('/app-versions/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить версию' })
    await userEvent.click(within(dialog).getByLabelText(/Платформа/))
    await userEvent.click(await within(dialog).findByRole('option', { name: 'IOS' }))
    await userEvent.type(within(dialog).getByLabelText(/Последняя версия/), '2.0.0')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/app-version/add', {
        platform: 'IOS',
        latestVersion: '2.0.0',
        minVersion: null,
        forceUpdate: false,
        storeUrl: null,
        releaseNotes: null,
      }),
    )
  })

  it('edits a platform picked from the list, with the platform fixed', async () => {
    renderPage('/app-versions/update/ANDROID')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить версию' })
    const latest = await within(dialog).findByLabelText(/Последняя версия/)
    await waitFor(() => expect(latest).toHaveValue('1.4.2'))
    expect(within(dialog).getByLabelText(/Платформа/)).toBeDisabled()
    await userEvent.clear(latest)
    await userEvent.type(latest, '1.5.0')
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Обязательное обновление' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/app-version/add', {
        platform: 'ANDROID',
        latestVersion: '1.5.0',
        minVersion: '1.2.0',
        forceUpdate: false,
        storeUrl: ANDROID.storeUrl,
        releaseNotes: 'Исправления',
      }),
    )
  })

  it('says so when the platform is not in the list, instead of an empty form', async () => {
    renderPage('/app-versions/update/WINDOWS')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить версию' })
    expect(await within(dialog).findByText('Не удалось загрузить данные.')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Сохранить' })).toBeDisabled()
  })

  it('requires a platform and the latest version', async () => {
    renderPage('/app-versions/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)
  })
})
