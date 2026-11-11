import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import { renderWithProviders } from '@/test/render'
import { feedbackRoutes } from './index'

// The real feedbackApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const CHATS = [
  { id: 1, userId: 501, userName: 'Алишер', notification: 2 },
  { id: 2, userId: 502, userName: 'Дилноза', notification: 0 },
]
const MESSAGES = [
  {
    id: 11,
    chatId: 77,
    userId: 501,
    sender: 'Алишер',
    content: 'Не считается цена окна',
    sendDate: '2026-11-10T09:15:00',
  },
  {
    id: 12,
    chatId: 77,
    userId: 10,
    sender: 'Admin',
    content: 'Проверим, спасибо',
    sendDate: '2026-11-10T09:20:00',
    isChecked: true,
  },
  { id: 13, chatId: 77, userId: 501, sender: 'Алишер', content: 'Вот скрин', imgId: 900 },
]

/** The parts of a sent multipart body. */
const sentParts = async () => {
  const body = http.post.mock.calls.find(([u]) => u === '/v1/feedback/send')![1] as FormData
  return {
    file: body.get('file'),
    data: JSON.parse(await (body.get('data') as Blob).text()),
  }
}

const render = (url = '/feedback') => renderWithProviders(<></>, { url, routes: feedbackRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/feedback/list') return { data: CHATS }
    if (url === '/v1/feedback/list/501') return { data: MESSAGES }
    if (url === '/v1/feedback/list/502') return { data: [] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockResolvedValue({ data: {} })
})

describe('Feedback', () => {
  it('lists the users with their unread counts and opens a conversation', async () => {
    const { router } = render()
    expect(
      await screen.findByText('Выберите пользователя, чтобы открыть переписку'),
    ).toBeInTheDocument()
    // the count is read out in words; the badge itself is hidden from screen readers
    expect(await screen.findByText('Непрочитанных: 2')).toBeInTheDocument()
    expect(screen.queryByText('Непрочитанных: 0')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Алишер/ }))
    expect(router.state.location.search).toBe('?chat=501')
    expect(await screen.findByText('Не считается цена окна')).toBeInTheDocument()
    expect(http.get).toHaveBeenCalledWith('/v1/feedback/list/501', expect.anything())

    // the admin's own message shows whether it was read; the user's picture comes from the files URL
    const mine = screen.getByText('Проверим, спасибо').closest('li')!
    expect(within(mine).getByLabelText('Прочитано')).toBeInTheDocument()
    expect(screen.getByAltText('Вот скрин').getAttribute('src')).toMatch(
      /\/v1\/file\/message\/img\/900$/,
    )
  })

  it('sends a text as the old page did: file "" and the admin as user 10', async () => {
    render('/feedback?chat=501')
    await screen.findByText('Не считается цена окна')
    const box = screen.getByRole('textbox', { name: 'Сообщение' })
    await userEvent.type(box, '  Исправили  ')
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/feedback/send', expect.any(FormData)),
    )
    expect(await sentParts()).toEqual({
      file: '',
      data: { content: 'Исправили', userId: 10, chatId: 77 },
    })
    await waitFor(() => expect(box).toHaveValue(''))
    // the conversation and the list (unread counts) are asked again
    const asked = (url: string) => http.get.mock.calls.filter(([u]) => u === url).length
    await waitFor(() => expect(asked('/v1/feedback/list/501')).toBe(2))
    await waitFor(() => expect(asked('/v1/feedback/list')).toBe(2))
  })

  it('sends with Enter and keeps Shift+Enter for a new line', async () => {
    render('/feedback?chat=501')
    await screen.findByText('Не считается цена окна')
    const box = screen.getByRole('textbox', { name: 'Сообщение' })
    await userEvent.type(box, 'Строка 1{Shift>}{Enter}{/Shift}Строка 2')
    expect(box).toHaveValue('Строка 1\nСтрока 2')
    expect(http.post).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(http.post).toHaveBeenCalled())
    expect((await sentParts()).data.content).toBe('Строка 1\nСтрока 2')
  })

  it('does not send an empty message', async () => {
    render('/feedback?chat=501')
    await screen.findByText('Не считается цена окна')
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled()
    await userEvent.type(screen.getByRole('textbox', { name: 'Сообщение' }), '   {Enter}')
    expect(http.post).not.toHaveBeenCalled()
  })

  it('sends a picture with its caption', async () => {
    render('/feedback?chat=501')
    await screen.findByText('Не считается цена окна')
    await userEvent.click(screen.getByRole('button', { name: 'Отправить изображение' }))
    const dialog = await screen.findByRole('dialog')
    const send = within(dialog).getByRole('button', { name: 'Отправить' })
    expect(send).toBeDisabled()

    const photo = new File(['png'], 'screen.png', { type: 'image/png' })
    await userEvent.upload(within(dialog).getByLabelText(/Изображение/), photo)
    await userEvent.type(within(dialog).getByLabelText('Подпись'), 'Исправленный расчёт')
    await userEvent.click(send)

    await waitFor(() => expect(http.post).toHaveBeenCalled())
    const parts = await sentParts()
    expect((parts.file as File).name).toBe('screen.png')
    expect(parts.data).toEqual({ content: 'Исправленный расчёт', userId: 10, chatId: 77 })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('shows an empty conversation', async () => {
    render('/feedback?chat=502')
    expect(await screen.findByText('В этой переписке пока нет сообщений')).toBeInTheDocument()
  })

  it('leaves chatId out of the first message of an empty conversation, as the old page', async () => {
    render('/feedback?chat=502')
    await screen.findByText('В этой переписке пока нет сообщений')
    await userEvent.type(screen.getByRole('textbox', { name: 'Сообщение' }), 'Здравствуйте{Enter}')
    await waitFor(() => expect(http.post).toHaveBeenCalled())
    expect((await sentParts()).data).toEqual({ content: 'Здравствуйте', userId: 10 })
  })

  it('shows a 4xx of a picture in its dialog and keeps it open', async () => {
    http.post.mockRejectedValue(new ApiError(400, 'Файл слишком большой'))
    render('/feedback?chat=501')
    await screen.findByText('Не считается цена окна')
    await userEvent.click(screen.getByRole('button', { name: 'Отправить изображение' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.upload(
      within(dialog).getByLabelText(/Изображение/),
      new File(['png'], 'big.png', { type: 'image/png' }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отправить' }))
    expect(await within(dialog).findByText('Файл слишком большой')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('refreshes the list and the open conversation', async () => {
    render('/feedback?chat=501')
    await screen.findByText('Не считается цена окна')
    const asked = (url: string) => http.get.mock.calls.filter(([u]) => u === url).length
    await userEvent.click(screen.getByRole('button', { name: 'Обновить' }))
    await waitFor(() => expect(asked('/v1/feedback/list/501')).toBe(2))
    expect(asked('/v1/feedback/list')).toBe(2)
  })
})
