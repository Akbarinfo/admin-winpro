import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { supplierRoutes } from './index'

// The real supplierApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const AKFA = {
  id: 5,
  name: 'Akfa',
  address: 'Ташкент',
  phone: '+998(71) 200 - 00 - 00',
  country: 'Uzbekistan',
  currencyId: 1,
  currencyName: 'Узбекский сум',
  types: 'PROFILES, FITTINGS',
  logoId: 77,
}

const renderSuppliers = (url = '/suppliers') =>
  renderWithProviders(<></>, { url, routes: supplierRoutes })

const tableBody = () => http.post.mock.calls.filter(([u]) => u === '/v1/supplier/table').at(-1)?.[1]

/** Reads the «data» JSON and the «image» part of a multipart body. */
async function parts(body: unknown) {
  const form = body as FormData
  return { data: JSON.parse(await (form.get('data') as Blob).text()), image: form.get('image') }
}

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/supplier/table'
      ? { data: { data: [AKFA], recordsTotal: 1, recordsFiltered: 1 } }
      : { data: {} },
  )
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/supplier/5') return { data: AKFA }
    if (url === '/v1/supplier/country') return { data: ['Uzbekistan', 'Kazakhstan'] }
    if (url === '/v1/supplier/enum/supplier/type')
      return {
        data: [
          { id: 1, name: 'PROFILES' },
          { id: 2, name: 'FITTINGS' },
          { id: 3, name: 'SEAL' },
        ],
      }
    if (url === '/v1/country/list')
      return {
        data: [
          {
            id: 2,
            name: 'Uzbekistan',
            code: 'uz',
            phoneCode: '+998',
            phoneFormat: '+998 (##) ### ## ##',
            isActive: true,
            isDefault: true,
          },
          {
            id: 1,
            name: 'Kazakhstan',
            code: 'kz',
            phoneCode: '+7',
            phoneFormat: '+7 (###) ### ## ##',
            isActive: true,
          },
        ],
      }
    if (url === '/v1/currency/list')
      return { data: [{ id: 1, name: 'Узбекский сум', symbol: 'сум', isMain: true }] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Suppliers', () => {
  it('lists suppliers with translated types and the logo', async () => {
    const { container } = renderSuppliers()
    const row = (await screen.findByText('Akfa')).closest('tr')!
    expect(within(row).getByText('Профили, Фурнитура')).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringMatching(/\/v1\/file\/supplier\/77$/),
    )
  })

  it('sorts by the old header keys', async () => {
    renderSuppliers()
    await screen.findByText('Akfa')
    await userEvent.click(screen.getByRole('button', { name: /Телефон/ }))
    await waitFor(() =>
      expect(tableBody()).toMatchObject({ order: [{ column: 'phone_number', dir: 'ASC' }] }),
    )
    await userEvent.click(screen.getByRole('button', { name: /Тип поставщика/ }))
    await waitFor(() =>
      expect(tableBody()).toMatchObject({ order: [{ column: 'type_supplier', dir: 'ASC' }] }),
    )
  })

  it('creates a supplier as multipart, like the old panel', async () => {
    renderSuppliers('/suppliers/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить поставщика' })
    await userEvent.type(within(dialog).getByLabelText(/Название/), 'Rehau')
    await userEvent.type(within(dialog).getByLabelText(/Телефон/), '901234567')
    await userEvent.click(within(dialog).getByLabelText(/Тип поставщика/))
    await userEvent.click(within(dialog).getByRole('option', { name: 'Уплотнения' }))
    const logo = new File(['png'], 'logo.png', { type: 'image/png' })
    await userEvent.upload(within(dialog).getByLabelText(/Логотип/), logo)
    // the crop dialog opens; keep the original
    const crop = await screen.findByRole('dialog', { name: 'Обрезать изображение' })
    await userEvent.click(within(crop).getByRole('button', { name: 'Загрузить оригинал' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/supplier', expect.any(FormData)),
    )
    const { data, image } = await parts(
      http.post.mock.calls.find(([u]) => u === '/v1/supplier')![1],
    )
    expect(data).toEqual({
      id: null,
      name: 'Rehau',
      address: '',
      phone: '+998 (90) 123 45 67',
      currencyId: null,
      types: 'SEAL',
      country: '',
      logoId: null,
    })
    expect(image).toBeInstanceOf(File)
    expect((image as File).name).toBe('logo.png')
  })

  it('accepts a phone from another country', async () => {
    renderSuppliers('/suppliers/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/Название/), 'Kaz Profile')
    await userEvent.click(within(dialog).getByRole('button', { name: /^Страна:/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: /Kazakhstan/ }))
    await userEvent.type(within(dialog).getByLabelText(/Телефон/), '7011234567')
    expect(within(dialog).getByLabelText(/Телефон/)).toHaveValue('+7 (701) 123 45 67')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/supplier', expect.any(FormData)),
    )
    const { data } = await parts(http.post.mock.calls.find(([u]) => u === '/v1/supplier')![1])
    expect(data.phone).toBe('+7 (701) 123 45 67')
  })

  it('rejects an incomplete phone', async () => {
    renderSuppliers('/suppliers/add')
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/Название/), 'Rehau')
    await userEvent.type(within(dialog).getByLabelText(/Телефон/), '9012')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findByText('Введите номер полностью')).toBeInTheDocument()
    expect(http.post).not.toHaveBeenCalledWith('/v1/supplier', expect.anything())
  })

  it('edits with PUT, keeps the logo and sends raw type values', async () => {
    renderSuppliers('/suppliers/update/5')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить поставщика' })
    await waitFor(() => expect(within(dialog).getByLabelText(/Название/)).toHaveValue('Akfa'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Очистить: Фурнитура' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(http.put).toHaveBeenCalled())
    const [url, body] = http.put.mock.calls[0]
    expect(url).toBe('/v1/supplier')
    const { data, image } = await parts(body)
    expect(data).toEqual({
      id: '5',
      name: 'Akfa',
      address: 'Ташкент',
      phone: '+998(71) 200 - 00 - 00',
      currencyId: 1,
      types: 'PROFILES',
      country: 'Uzbekistan',
      logoId: 77,
    })
    expect(image).toBe('null')
  })

  it('deletes after confirmation', async () => {
    renderSuppliers()
    const row = (await screen.findByText('Akfa')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/supplier/5'))
  })
})
