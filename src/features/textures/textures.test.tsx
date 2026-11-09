import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { textureRoutes } from './index'

// The real API runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const http = vi.mocked(api)

const OAK = {
  id: 3,
  name: 'Золотой дуб',
  color: '#a8743d',
  priority: 10,
  imageId: 41,
  isDouble: true,
}
const WHITE = {
  id: 4,
  name: 'Белый',
  color: '#f7f7f5',
  priority: 1,
  imageId: null,
  isDouble: false,
}
const MATCH = {
  id: 90,
  matchingTextureId: 4,
  matchingSideType: 'INSIDE',
  matchingTextureDto: { name: 'Белый', color: '#f7f7f5', imageId: null },
}

const renderPage = (url = '/textures') => renderWithProviders(<></>, { url, routes: textureRoutes })

async function parts(body: unknown) {
  const form = body as FormData
  return { data: JSON.parse(await (form.get('data') as Blob).text()), image: form.get('image') }
}

beforeEach(() => {
  vi.clearAllMocks()
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/texture/table'
      ? { data: { data: [OAK, WHITE], recordsTotal: 2, recordsFiltered: 2 } }
      : { data: {} },
  )
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/texture/3') return { data: OAK }
    if (url === '/v1/texture/list') return { data: [OAK, WHITE] }
    if (url === '/v1/texture/matching/list/3') return { data: [MATCH] }
    if (url === '/v1/texture/matching/90') return { data: MATCH }
    if (url === '/v1/texture/matching/matching-site-type') return { data: ['INSIDE', 'OUTSIDE'] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Textures', () => {
  it('lists textures with colour and image', async () => {
    renderPage()
    const row = (await screen.findByText('Золотой дуб')).closest('tr')!
    expect(within(row).getByText('#a8743d')).toBeInTheDocument()
    expect(row.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringMatching(/\/v1\/file\/texture\/41$/),
    )
  })

  it('shows the matches of the clicked texture and adds one with the old body', async () => {
    renderPage()
    expect(await screen.findByText(/Выберите текстуру в таблице выше/)).toBeInTheDocument()
    await userEvent.click(await screen.findByText('Золотой дуб'))

    const panel = screen
      .getByRole('heading', { name: 'Соответствующие текстуры' })
      .closest('div')!.parentElement!
    expect(await within(panel).findByText('Белый')).toBeInTheDocument()

    await userEvent.click(within(panel).getByRole('button', { name: 'Добавить соответствие' }))
    const dialog = await screen.findByRole('dialog', { name: 'Добавить соответствие' })
    await userEvent.click(within(dialog).getByLabelText(/Текстура/))
    // the texture itself is not offered
    expect(
      within(dialog)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Белый'])
    await userEvent.click(within(dialog).getByRole('option', { name: 'Белый' }))
    await userEvent.click(within(dialog).getByLabelText(/Сторона/))
    await userEvent.click(within(dialog).getByRole('option', { name: /OUTSIDE/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/texture/matching', {
        id: null,
        textureId: 3,
        matchingTextureId: 4,
        matchingSideType: 'OUTSIDE',
        price: '',
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
  })

  it('edits a match with the texture id, so it stays attached to the texture', async () => {
    renderPage('/textures?texture=3')
    const panel = (
      await screen.findByRole('heading', { name: 'Соответствующие текстуры' })
    ).closest('div')!.parentElement!
    const row = (await within(panel).findByText('Белый')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))

    const dialog = await screen.findByRole('dialog', { name: 'Изменить соответствие' })
    await waitFor(() => expect(within(dialog).getByLabelText(/Сторона/)).toHaveValue('INSIDE'))
    await userEvent.click(within(dialog).getByLabelText(/Сторона/))
    await userEvent.click(within(dialog).getByRole('option', { name: /OUTSIDE/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    // the old panel's edit body: { id, textureId, matchingTextureId, matchingSideType }
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/texture/matching', {
        id: 90,
        textureId: 3,
        matchingTextureId: 4,
        matchingSideType: 'OUTSIDE',
      }),
    )
  })

  it('deletes a match', async () => {
    renderPage('/textures?texture=3')
    const panel = (
      await screen.findByRole('heading', { name: 'Соответствующие текстуры' })
    ).closest('div')!.parentElement!
    const row = (await within(panel).findByText('Белый')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }))
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/texture/matching/90'))
  })

  it('edits a texture as multipart and keeps its image', async () => {
    renderPage('/textures/update/3')
    const dialog = await screen.findByRole('dialog', { name: 'Изменить текстуру' })
    const name = await within(dialog).findByLabelText(/Название/)
    await waitFor(() => expect(name).toHaveValue('Золотой дуб'))
    await userEvent.clear(name)
    await userEvent.type(name, 'Дуб')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(http.put).toHaveBeenCalledWith('/v1/texture', expect.any(FormData)))
    const { data, image } = await parts(http.put.mock.calls[0][1])
    expect(data).toEqual({
      id: '3',
      name: 'Дуб',
      color: '#a8743d',
      priority: 10,
      isDouble: true,
      imageId: 41,
    })
    expect(image).toBe('null')
  })

  it('requires name and priority and a valid colour', async () => {
    renderPage('/textures/add')
    const dialog = await screen.findByRole('dialog', { name: 'Добавить текстуру' })
    await userEvent.clear(within(dialog).getByLabelText(/Цвет/))
    await userEvent.type(within(dialog).getByLabelText(/Цвет/), 'red')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findAllByText('Заполните это поле')).toHaveLength(2)
    expect(within(dialog).getByText('Цвет в формате #RRGGBB')).toBeInTheDocument()
  })

  it('sends the old texture-group page to the textures list', async () => {
    const { router } = renderPage('/texturegroup')
    await waitFor(() => expect(router.state.location.pathname).toBe('/textures'))
  })
})
