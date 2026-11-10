import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { useSession } from '@/shared/store/session'
import { renderWithProviders } from '@/test/render'
import { countryRoutes } from './index'
import { countrySchema } from './schema'

// The real API runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const UZ = {
  id: 2,
  name: 'Uzbekistan',
  code: 'uz',
  phoneCode: '+998',
  phoneFormat: '+998 (##) ### ## ##',
  digitsLength: 9,
  length: 13,
  codeSlice: '/^\\+998/',
  currencyId: 1,
  currencyName: 'Узбекский сум',
  storageBucket: 'winpro-uz',
  isActive: true,
  isDefault: true,
  flagUrl: 'https://storage.winpro.uz/flags/uz.png',
}

const renderPage = (url = '/country') => renderWithProviders(<></>, { url, routes: countryRoutes })

/** The JSON part of the multipart body. */
const countryPart = async (body: FormData) => JSON.parse(await (body.get('country') as Blob).text())

beforeEach(() => {
  vi.clearAllMocks()
  useSession.setState({ token: 't', user: { role: 'ADMINISTRATOR' } })
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/country/list') return { data: [UZ] }
    if (url === '/v1/country/2') return { data: UZ }
    if (url === '/v1/country-provider/2')
      return { data: [{ id: 9, provider: 'SMS', sortOrder: 1, isActive: true }] }
    if (url === '/v1/currency/list')
      return { data: [{ id: 1, name: 'Узбекский сум', symbol: 'сум', isMain: true }] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockResolvedValue({ data: {} })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

async function fillNewCountry() {
  await userEvent.type(screen.getByLabelText(/Название/), 'Kazakhstan')
  await userEvent.type(screen.getByLabelText(/Код \(ISO\)/), 'kz')
  await userEvent.type(screen.getByLabelText(/Телефонный код/), '+7')
  await userEvent.type(screen.getByLabelText(/Формат телефона/), '+7 (###) ### ## ##')
  await userEvent.type(screen.getByLabelText(/Количество цифр/), '10')
  await userEvent.type(screen.getByLabelText(/Общая длина/), '12')
  await userEvent.type(screen.getByLabelText(/Срез кода/), '/^\\+7/')
}

describe('Countries', () => {
  it('lists countries with bucket and status', async () => {
    renderPage()
    const row = (await screen.findByText('Uzbekistan')).closest('tr')!
    expect(within(row).getByText('winpro-uz')).toBeInTheDocument()
    expect(within(row).getByText('Узбекский сум')).toBeInTheDocument()
    expect(within(row).getByText('По умолчанию')).toBeInTheDocument()
  })

  it('creates as multipart «country» without an id or a file part', async () => {
    renderPage('/country/add')
    // The guide opens once when adding.
    const guide = await screen.findByRole('dialog', { name: 'Как добавить страну' })
    await userEvent.click(within(guide).getByRole('button', { name: 'Понятно' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await fillNewCountry()
    await userEvent.click(screen.getByRole('switch', { name: 'Активна' }))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/v1/country', expect.any(FormData)))
    const body = http.post.mock.calls[0][1] as FormData
    expect(await countryPart(body)).toEqual({
      name: 'Kazakhstan',
      code: 'kz',
      isActive: true,
      length: 12,
      isDefault: false,
      phoneCode: '+7',
      codeSlice: '/^\\+7/',
      phoneFormat: '+7 (###) ### ## ##',
      digitsLength: 10,
      currencyId: null,
      storageBucket: null,
    })
    expect(body.has('file')).toBe(false)
  })

  it('edits with PUT and the id, without asking when the bucket is unchanged', async () => {
    renderPage('/country/update/2')
    await waitFor(() => expect(screen.getByLabelText(/Название/)).toHaveValue('Uzbekistan'))
    // No guide when editing.
    expect(screen.queryByRole('dialog', { name: 'Как добавить страну' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalledWith('/v1/country', expect.any(FormData)))
    expect(await countryPart(http.put.mock.calls[0][1] as FormData)).toMatchObject({
      id: 2,
      storageBucket: 'winpro-uz',
      currencyId: 1,
    })
  })

  it('asks before changing the bucket, and saves only when confirmed', async () => {
    renderPage('/country/update/2')
    const bucket = await screen.findByLabelText(/Bucket для файлов/)
    await waitFor(() => expect(bucket).toHaveValue('winpro-uz'))
    await userEvent.clear(bucket)
    await userEvent.type(bucket, 'Winpro-KZ')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    let dialog = await screen.findByRole('dialog', { name: 'Изменить bucket хранения?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }))
    expect(http.put).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    dialog = await screen.findByRole('dialog', { name: 'Изменить bucket хранения?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Изменить и сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalled())
    expect(await countryPart(http.put.mock.calls[0][1] as FormData)).toMatchObject({
      storageBucket: 'winpro-kz',
    })
  })

  it('shows a missing bucket from the backend under the bucket field', async () => {
    // Spring-style body: the code is in `message`, `error` is the generic reason.
    http.put.mockRejectedValue(
      new ApiError(400, 'Bad Request', undefined, 'Bad Request error.bucket.not.found'),
    )
    renderPage('/country/update/2')
    const bucket = await screen.findByLabelText(/Bucket для файлов/)
    await waitFor(() => expect(bucket).toHaveValue('winpro-uz'))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(
      await screen.findByText('Такой bucket не найден в MinIO. Сначала создайте его.'),
    ).toBeInTheDocument()
  })

  it('only an administrator can edit the bucket — and saving keeps it', async () => {
    useSession.setState({ user: { role: 'MANAGER' } })
    renderPage('/country/update/2')
    const bucket = await screen.findByLabelText(/Bucket для файлов/)
    await waitFor(() => expect(bucket).toHaveValue('winpro-uz'))
    expect(bucket).toHaveAttribute('readonly')
    expect(screen.getByText('Изменять может только администратор')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalled())
    // Not cleared: a disabled field would be left out and sent as null.
    expect(await countryPart(http.put.mock.calls[0][1] as FormData)).toMatchObject({
      storageBucket: 'winpro-uz',
    })
  })

  it('sends a newly chosen flag as the «file» part', async () => {
    renderPage('/country/update/2')
    await waitFor(() => expect(screen.getByLabelText(/Название/)).toHaveValue('Uzbekistan'))
    const flag = new File(['png'], 'uz.png', { type: 'image/png' })
    await userEvent.upload(screen.getByLabelText(/^Флаг/), flag)
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalled())
    expect((http.put.mock.calls[0][1] as FormData).get('file')).toBe(flag)
  })

  it('shows a load error instead of an empty form', async () => {
    http.get.mockImplementation(async (url: string) => {
      if (url === '/v1/country/2') throw new ApiError(404, 'not found')
      return { data: [] }
    })
    renderPage('/country/update/2')
    expect(await screen.findByText('Не удалось загрузить данные.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Название/)).not.toBeInTheDocument()
  })

  it('manages code providers of a saved country', async () => {
    renderPage('/country/update/2')
    const section = await screen.findByRole('region', { name: /Провайдеры кодов/ })
    expect(await within(section).findByText('SMS')).toBeInTheDocument()

    await userEvent.click(within(section).getByRole('button', { name: 'Добавить' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить провайдер' })
    await userEvent.selectOptions(within(dialog).getByLabelText(/Провайдер/), 'TELEGRAM')
    await userEvent.clear(within(dialog).getByLabelText(/Порядок/))
    await userEvent.type(within(dialog).getByLabelText(/Порядок/), '2')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/country-provider', {
        provider: 'TELEGRAM',
        sortOrder: 2,
        isActive: true,
        countryId: 2,
      }),
    )

    await userEvent.click(within(section).getByRole('button', { name: 'Изменить' }))
    const edit = await screen.findByRole('dialog', { name: 'Изменить провайдер' })
    await userEvent.click(within(edit).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/country-provider', {
        id: 9,
        provider: 'SMS',
        sortOrder: 1,
        isActive: true,
        countryId: 2,
      }),
    )
  })

  it('deletes a code provider after confirmation', async () => {
    renderPage('/country/update/2')
    const section = await screen.findByRole('region', { name: /Провайдеры кодов/ })
    await within(section).findByText('SMS')
    await userEvent.click(within(section).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/country-provider/9'))
  })

  it('deletes a country after confirmation', async () => {
    renderPage()
    const row = (await screen.findByText('Uzbekistan')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/country/2'))
  })
})

describe('countrySchema', () => {
  const valid = {
    name: 'Uzbekistan',
    code: 'uz',
    phoneCode: '+998',
    phoneFormat: '+998 (##) ### ## ##',
    digitsLength: 9,
    length: 13,
    codeSlice: '/^\\+998/',
    currencyId: null,
    storageBucket: '',
    isActive: true,
    isDefault: false,
    file: null,
  }

  it('normalizes the bucket and checks its name', () => {
    expect(countrySchema.parse({ ...valid, storageBucket: ' Winpro-UZ ' }).storageBucket).toBe(
      'winpro-uz',
    )
    expect(countrySchema.safeParse({ ...valid, storageBucket: '-bad' }).success).toBe(false)
    expect(countrySchema.safeParse({ ...valid, storageBucket: 'ab' }).success).toBe(false)
  })

  it('requires the phone settings', () => {
    const result = countrySchema.safeParse({ ...valid, phoneCode: '', digitsLength: null })
    expect(result.error?.issues.map((i) => i.path[0])).toEqual(['phoneCode', 'digitsLength'])
  })
})
