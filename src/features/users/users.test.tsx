import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { userRoutes } from './index'

// The real API runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const ADMIN = {
  id: 5,
  fullName: 'Иван Петров',
  username: 'ivan@winpro.uz',
  phone: '+998 (90) 123 45 67',
  role: 'ADMINISTRATOR',
  imageId: 44,
  supplierId: null,
}

const renderPage = (url = '/user') => renderWithProviders(<></>, { url, routes: userRoutes })

/** The JSON part of a multipart body. */
const dataPart = async (body: FormData) => JSON.parse(await (body.get('data') as Blob).text())

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/user/table')
      return { data: { data: [ADMIN], recordsTotal: 1, recordsFiltered: 1 } }
    if (url === '/v1/supplier/table')
      return { data: { data: [{ id: 3, name: 'Akfa Group', address: 'x' }], recordsFiltered: 1 } }
    return { data: {} }
  })
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/user/5') return { data: ADMIN }
    if (url === '/v1/user/enum/role/type')
      return {
        data: [{ name: 'ADMINISTRATOR' }, { name: 'MANAGER' }, { name: 'SUPPLIER_OWNER' }],
      }
    if (url === '/v1/country/list') return { data: [] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Users', () => {
  it('lists users', async () => {
    renderPage()
    const row = (await screen.findByText('Иван Петров')).closest('tr')!
    expect(within(row).getByText('ivan@winpro.uz')).toBeInTheDocument()
    expect(within(row).getByText('ADMINISTRATOR')).toBeInTheDocument()
  })

  it('creates a supplier owner as multipart, with a supplier', async () => {
    renderPage('/user/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить пользователя' })
    await userEvent.type(within(dialog).getByLabelText(/ФИО/), 'Сардор')
    await userEvent.type(within(dialog).getByLabelText(/Логин/), 'sardor@akfa.uz')
    await userEvent.type(within(dialog).getByLabelText(/^Пароль/), 'secret1')
    await userEvent.click(within(dialog).getByLabelText(/Роль/))
    await userEvent.click(await within(dialog).findByRole('option', { name: 'SUPPLIER_OWNER' }))

    // A supplier is required for supplier staff.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findByText('Заполните это поле')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByLabelText(/Поставщик/))
    await userEvent.click(await within(dialog).findByRole('option', { name: 'Akfa Group' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/user/', expect.any(FormData)))
    const body = http.post.mock.calls.find(([url]) => url === '/v1/user/')![1] as FormData
    expect(await dataPart(body)).toEqual({
      id: null,
      fullName: 'Сардор',
      username: 'sardor@akfa.uz',
      phone: '',
      role: 'SUPPLIER_OWNER',
      password: 'secret1',
      newPassword: null,
      imageId: null,
      supplierId: 3,
    })
    expect(body.get('image')).toBe('null')
  })

  it('edits with PUT, a new password only when typed', async () => {
    renderPage('/user/update/5')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить пользователя' })
    await waitFor(() => expect(within(dialog).getByLabelText(/ФИО/)).toHaveValue('Иван Петров'))
    expect(within(dialog).queryByLabelText(/^Пароль/)).not.toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Роль/)).toHaveValue('ADMINISTRATOR')

    await userEvent.type(within(dialog).getByLabelText(/Новый пароль/), 'n3w')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalledWith('/v1/user/', expect.any(FormData)))
    expect(await dataPart(http.put.mock.calls[0][1] as FormData)).toEqual({
      id: '5',
      fullName: 'Иван Петров',
      username: 'ivan@winpro.uz',
      phone: '+998 (90) 123 45 67',
      role: 'ADMINISTRATOR',
      password: '',
      newPassword: 'n3w',
      imageId: 44,
      supplierId: null,
    })
  })

  it('saves an edit without touching the password', async () => {
    renderPage('/user/update/5')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить пользователя' })
    await waitFor(() => expect(within(dialog).getByLabelText(/ФИО/)).toHaveValue('Иван Петров'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalled())
    // Like the old panel: password "" (the backend rejects null), newPassword "" — keep the current one.
    expect(await dataPart(http.put.mock.calls[0][1] as FormData)).toMatchObject({
      password: '',
      newPassword: '',
    })
  })

  it('checks the login is an email and asks for a password', async () => {
    renderPage('/user/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/ФИО/), 'Сардор')
    await userEvent.type(within(dialog).getByLabelText(/Логин/), 'sardor')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findByText('Введите корректный email')).toBeInTheDocument()
    expect(within(dialog).getByText('Заполните это поле')).toBeInTheDocument()
  })

  it('deletes after confirmation', async () => {
    renderPage()
    const row = (await screen.findByText('Иван Петров')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/user/5'))
  })
})
