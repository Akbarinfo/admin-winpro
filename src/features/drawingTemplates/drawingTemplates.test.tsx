import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { drawingTemplateRoutes } from './index'

// The real drawingTemplateApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))

// The constructor draws on a canvas jsdom doesn't have: a stand-in whose drawing is a known window.
const cc = vi.hoisted(() => ({ opened: [] as string[] }))
vi.mock('@/shared/config/env', () => ({ env: { API_URL: '', WEBCC_TOKEN: 'test-token' } }))
vi.mock('webcc', () => ({
  Runtime: class {
    shapeManager = {
      width: 1500,
      height: 1300,
      area: 1.95,
      profileSystem: { id: 11 },
      mainTextureId: 21,
      openFile: (json: string) => cc.opened.push(json),
      toSimpleNoDimData: () => 'data:image/png;base64,DRAWING',
    }
    stage = { destroy: () => {} }
    constructor(_token: string, containerId?: string) {
      if (!document.getElementById(containerId ?? 'webcc')) throw new Error('container not found')
    }
    setCanvasScale() {}
  },
}))

const http = vi.mocked(api)

const ROWS = [
  {
    id: 3,
    name: 'Балкон',
    profileSystemName: 'Termo 70',
    textureName: 'Белый',
    type: 'WINDOW',
    width: 1500,
    height: 1300,
    imageId: 40,
  },
]
const BALCONY = {
  id: 3,
  name: 'Балкон',
  type: 'WINDOW',
  profileSystemId: 12,
  textureId: 22,
  width: 1000,
  height: 1000,
  area: 1,
  imageId: 40,
  templeteJson: '{"shapes":[3]}',
}

const tableCalls = () => http.post.mock.calls.filter(([u]) => u === '/v1/drawing/templete/table')
async function parts(body: unknown) {
  const form = body as FormData
  return {
    data: JSON.parse(await (form.get('data') as Blob).text()),
    image: form.get('image'),
    json: form.get('json'),
  }
}
const render = (url = '/templetes') =>
  renderWithProviders(<></>, { url, routes: drawingTemplateRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  cc.opened.length = 0
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/drawing/templete/table'
      ? { data: { data: ROWS, recordsTotal: 1, recordsFiltered: 1 } }
      : { data: {} },
  )
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
  http.get.mockImplementation(async (url: string) => {
    // the old form read the answer as a list
    if (url === '/v1/drawing/templete/3') return { data: [BALCONY] }
    if (url === '/v1/drawing/templete/types') return { data: ['WINDOW', 'DOOR'] }
    if (url === '/v1/profile/system/list')
      return {
        data: [
          { id: 11, name: 'Termo 70', parentName: 'Akfa' },
          { id: 12, name: 'Termo 60', parentName: 'Akfa' },
        ],
      }
    if (url === '/v1/texture/list/system/11') return { data: [{ id: 21, name: 'Белый' }] }
    if (url === '/v1/texture/list/system/12') return { data: [{ id: 22, name: 'Золотой дуб' }] }
    throw new Error(`unexpected GET ${url}`)
  })
})

describe('Drawing templates', () => {
  it('lists them 20 a page, newest first', async () => {
    render()
    const row = (await screen.findByText('Балкон')).closest('tr')!
    expect(tableCalls()[0][1]).toMatchObject({
      length: 20,
      order: [{ column: 'id', dir: 'DESC' }],
      filter: {},
    })
    expect(within(row).getByText('Termo 70')).toBeInTheDocument()
    expect(within(row).getByText('1 500')).toBeInTheDocument()
  })

  it('edits one: its drawing opens, and the drawing gives sizes, system and texture', async () => {
    const { router } = render('/templetes/update/3')
    await waitFor(() => expect(screen.getByLabelText(/^Наименование/)).toHaveValue('Балкон'))
    expect(screen.getByRole('combobox', { name: 'Профильная система' })).toHaveValue(
      'Termo 60 - Akfa',
    )
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Текстура' })).toHaveValue('Золотой дуб'),
    )
    // opened as saved; the sizes stay the saved ones until asked (as before)
    await waitFor(() => expect(cc.opened).toEqual(['{"shapes":[3]}']))
    expect(screen.getByLabelText(/^Ширина/)).toHaveValue('1 000')

    await userEvent.click(screen.getByRole('button', { name: 'Взять размеры из конструктора' }))
    expect(screen.getByLabelText(/^Ширина/)).toHaveValue('1 500')
    expect(screen.getByRole('combobox', { name: 'Профильная система' })).toHaveValue(
      'Termo 70 - Akfa',
    )
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Текстура' })).toHaveValue('Белый'),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/drawing/templete', expect.any(FormData)),
    )
    const sent = await parts(http.put.mock.calls[0][1])
    expect(sent.data).toEqual({
      id: '3',
      name: 'Балкон',
      imageId: 40,
      type: 'WINDOW',
      profileSystemId: 11,
      textureId: 21,
      width: 1500,
      height: 1300,
      area: 1.95,
    })
    expect(sent.image).toBe('')
    expect(sent.json).toBe('')
    await waitFor(() => expect(router.state.location.pathname).toBe('/templetes'))
  })

  it('adds one with a drawing file; another system clears the texture', async () => {
    render('/templetes/add')
    await userEvent.type(await screen.findByLabelText(/^Наименование/), 'Дверь')
    await userEvent.click(screen.getByRole('combobox', { name: 'Профильная система' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Termo 60 - Akfa' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Текстура' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Золотой дуб' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Профильная система' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Termo 70 - Akfa' }))
    expect(screen.getByRole('combobox', { name: 'Текстура' })).toHaveValue('')

    const drawing = new File(['{"shapes":[4]}'], 'door.json', { type: 'application/json' })
    await userEvent.upload(screen.getByLabelText('Файл чертежа (JSON)'), drawing)
    await waitFor(() => expect(cc.opened).toEqual(['{"shapes":[4]}']))
    for (const [label, value] of [
      [/^Ширина/, '900'],
      [/^Высота/, '2100'],
      [/^Площадь/, '1.89'],
    ] as const)
      await userEvent.type(screen.getByLabelText(label), value)

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/drawing/templete', expect.any(FormData)),
    )
    const sent = await parts(http.post.mock.calls.find(([u]) => u === '/v1/drawing/templete')![1])
    expect(sent.data).toEqual({
      id: null,
      name: 'Дверь',
      imageId: null,
      type: null,
      profileSystemId: 11,
      textureId: null,
      width: 900,
      height: 2100,
      area: 1.89,
    })
    expect((sent.json as File).name).toBe('door.json')
    // no picture: "null" when adding, as the old form sent ("" when editing)
    expect(sent.image).toBe('null')
  })

  it('requires the name and the three sizes', async () => {
    render('/templetes/add')
    await screen.findByLabelText(/^Наименование/)
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findAllByText('Заполните это поле')).toHaveLength(4)
    expect(http.post).not.toHaveBeenCalledWith('/v1/drawing/templete', expect.anything())
  })

  it('deletes one after confirmation', async () => {
    render()
    const row = (await screen.findByText('Балкон')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Удалить' }),
    )
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/drawing/templete/3'))
  })
})
