import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { mobileUserRoutes } from './index'

// The real API runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const NEW_USER = {
  id: 31,
  createdDate: '2026-11-02T10:30:00',
  fullName: 'Алишер Каримов',
  username: 'alisher',
  phone: '+998901234567',
  role: 'WORKSHOP_OWNER',
  isChecked: false,
  workshopId: 8,
}
const CHECKED = { ...NEW_USER, id: 32, fullName: 'Дилноза Юсупова', isChecked: true }

const renderPage = () =>
  renderWithProviders(<></>, { url: '/mobile_user', routes: mobileUserRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockResolvedValue({
    data: { data: [NEW_USER, CHECKED], recordsTotal: 2, recordsFiltered: 2 },
  })
  http.put.mockResolvedValue({ data: {} })
})

describe('Mobile users', () => {
  it('lists users from the v2 table with their check status', async () => {
    renderPage()
    const row = (await screen.findByText('Алишер Каримов')).closest('tr')!
    expect(within(row).getByText('02.11.2026 10:30')).toBeInTheDocument()
    expect(within(row).getByText('Не проверен')).toBeInTheDocument()
    expect(http.post).toHaveBeenCalledWith(
      '/v2/mobile-user/table',
      expect.objectContaining({ start: 0 }),
      expect.anything(),
    )
    // Already checked users have no action.
    const checked = screen.getByText('Дилноза Юсупова').closest('tr')!
    expect(within(checked).queryByRole('button')).not.toBeInTheDocument()
  })

  it('marks a user as checked after confirmation', async () => {
    renderPage()
    const row = (await screen.findByText('Алишер Каримов')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Отметить проверенным' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Алишер Каримов')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отметить проверенным' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/mobile-user/update/is-checked', {
        id: 31,
        isChecked: true,
      }),
    )
  })
})
