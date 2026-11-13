import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { templateRoutes } from './index'

// The real templateApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))

// The constructor draws on a canvas jsdom doesn't have: a stand-in with fixed sizes and image.
const cc = vi.hoisted(() => ({
  env: { API_URL: '', WEBCC_TOKEN: 'test-token' },
  opened: [] as string[],
  started: [] as { token: string; containerId?: string }[],
  destroyed: 0,
}))
vi.mock('@/shared/config/env', () => ({ env: cc.env }))
vi.mock('webcc', () => ({
  Runtime: class {
    shapeManager = {
      width: 1200,
      height: 1400,
      area: 1.68,
      openFile: (json: string) => cc.opened.push(json),
      toSimpleNoDimData: () => 'data:image/png;base64,DRAWING',
    }
    stage = { destroy: () => void cc.destroyed++ }
    constructor(token: string, containerId?: string) {
      // as the real one: it draws into an element that must already be on the page
      if (!document.getElementById(containerId ?? 'webcc')) throw new Error('container not found')
      cc.started.push({ token, containerId })
    }
    setCanvasScale() {}
  },
}))

const http = vi.mocked(api)

const ROWS = [
  { id: 5, name: 'Окно 2 створки', materialType: { name: 'ПВХ' }, imageId: 70 },
  { id: 6, name: 'Дверь', materialTypeName: 'Алюминий' },
]
const PARENT = {
  id: 5,
  name: 'Окно 2 створки',
  materialTypeId: 3,
  imageId: 70,
  width: 1000,
  height: 1000,
  area: 1,
  templeteJson: '{"shapes":[1]}',
}

const tableCalls = () => http.post.mock.calls.filter(([u]) => u === '/v1/templates/table')
async function parts(body: unknown) {
  const form = body as FormData
  return {
    data: JSON.parse(await (form.get('data') as Blob).text()),
    image: form.get('image'),
    json: form.get('json'),
  }
}
const render = (url = '/templates') => renderWithProviders(<></>, { url, routes: templateRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  cc.env.WEBCC_TOKEN = 'test-token'
  cc.opened.length = 0
  cc.started.length = 0
  cc.destroyed = 0
  http.post.mockImplementation(async (url: string) =>
    url === '/v1/templates/table'
      ? { data: { data: ROWS, recordsTotal: 2, recordsFiltered: 2 } }
      : { data: {} },
  )
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
  http.get.mockImplementation(async (url: string) => {
    if (url === '/v1/templates/5') return { data: PARENT }
    if (url === '/v1/templates/6') return { data: { id: 6, name: 'Дверь', parentId: 5 } }
    if (url === '/v1/templates/8') return { data: { id: 8, name: 'Створка', materialTypeId: 3 } }
    if (url === '/v1/material-type/list')
      return {
        data: [
          { id: 3, name: 'ПВХ' },
          { id: 4, name: 'Алюминий' },
        ],
      }
    throw new Error(`unexpected GET ${url}`)
  })
})

/** Fills the required fields of a new template. */
async function fillNew() {
  await userEvent.type(await screen.findByLabelText(/^Наименование/), 'Окно 3 створки')
  await userEvent.click(screen.getByRole('combobox', { name: /^Тип/ }))
  await userEvent.click(await screen.findByRole('option', { name: 'ПВХ' }))
}

describe('Templates', () => {
  it('lists templates 20 a page, newest first, with the type either way it comes', async () => {
    render()
    expect(await screen.findByText('Окно 2 створки')).toBeInTheDocument()
    expect(tableCalls()[0][1]).toMatchObject({
      start: 0,
      length: 20,
      order: [{ column: 'id', dir: 'DESC' }],
      filter: {},
    })
    expect(screen.getByText('ПВХ')).toBeInTheDocument()
    expect(screen.getByText('Алюминий')).toBeInTheDocument()
  })

  it('adds a template: sizes and image from the constructor, the drawing file sent as chosen', async () => {
    const { router } = render('/templates/add')
    await fillNew()
    // the constructor starts with the token, in its own container
    await waitFor(() =>
      expect(cc.started).toEqual([
        { token: 'test-token', containerId: expect.stringMatching(/^webcc-/) },
      ]),
    )
    expect(document.getElementById(cc.started[0].containerId!)).toBeInTheDocument()

    const drawing = new File(['{"shapes":[2]}'], 'okno.json', { type: 'application/json' })
    await userEvent.upload(screen.getByLabelText('Файл чертежа (JSON)'), drawing)
    await waitFor(() => expect(cc.opened).toEqual(['{"shapes":[2]}']))
    expect(screen.getByLabelText(/^Ширина/)).toHaveValue('1 200')

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/templates', expect.any(FormData)),
    )
    const sent = await parts(http.post.mock.calls.find(([u]) => u === '/v1/templates')![1])
    expect(sent.data).toEqual({
      id: null,
      name: 'Окно 3 створки',
      imageId: null,
      materialTypeId: 3,
      base64Image: 'data:image/png;base64,DRAWING',
      width: 1200,
      height: 1400,
      area: 1.68,
    })
    expect(sent.image).toBe('')
    expect((sent.json as File).name).toBe('okno.json')
    await waitFor(() => expect(router.state.location.pathname).toBe('/templates'))
  })

  it('requires the name, type and sizes', async () => {
    render('/templates/add')
    await screen.findByLabelText(/^Наименование/)
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    expect(await screen.findAllByText('Заполните это поле')).toHaveLength(4)
    expect(http.post).not.toHaveBeenCalledWith('/v1/templates', expect.anything())
  })

  it('edits a template: its drawing opens, its children are listed, and it stays open', async () => {
    const { router } = render('/templates/update/5')
    await waitFor(() =>
      expect(screen.getByLabelText(/^Наименование/)).toHaveValue('Окно 2 створки'),
    )
    // the saved drawing opens and its sizes replace the saved ones (as the old form did)
    await waitFor(() => expect(cc.opened).toEqual(['{"shapes":[1]}']))
    await waitFor(() => expect(screen.getByLabelText(/^Высота/)).toHaveValue('1 400'))

    // the children: the same table, filtered by the parent
    await waitFor(() =>
      expect(
        tableCalls().some(
          ([, body]) => (body as { filter: { parentId?: string } }).filter.parentId === '5',
        ),
      ).toBe(true),
    )
    const children = screen.getByRole('region', { name: 'Дочерние шаблоны' })
    expect(within(children).getByText('Дверь')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/templates', expect.any(FormData)),
    )
    const sent = await parts(http.put.mock.calls[0][1])
    expect(sent.data).toMatchObject({ id: '5', imageId: 70, width: 1200, height: 1400, area: 1.68 })
    expect(sent.data).not.toHaveProperty('parentId')
    expect(sent.json).toBe('')
    expect(router.state.location.pathname).toBe('/templates/update/5')
  })

  it('adds a child under its parent and goes back to the parent', async () => {
    const { router } = render('/templates/update/5/add-child')
    expect(
      await screen.findByRole('heading', { name: 'Добавить дочерний шаблон' }),
    ).toBeInTheDocument()
    await fillNew()
    await userEvent.type(screen.getByLabelText(/^Ширина/), '600')
    await userEvent.type(screen.getByLabelText(/^Высота/), '900')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/templates', expect.any(FormData)),
    )
    const sent = await parts(http.post.mock.calls.find(([u]) => u === '/v1/templates')![1])
    expect(sent.data).toMatchObject({ id: null, parentId: '5', width: 600, height: 900 })
    await waitFor(() => expect(router.state.location.pathname).toBe('/templates/update/5'))
  })

  it('takes the sizes from the constructor on demand', async () => {
    render('/templates/update/5/update-child/8')
    await waitFor(() => expect(screen.getByLabelText(/^Наименование/)).toHaveValue('Створка'))
    const button = screen.getByRole('button', { name: 'Взять размеры из конструктора' })
    await waitFor(() => expect(button).toBeEnabled())
    await userEvent.click(button)
    expect(screen.getByLabelText(/^Ширина/)).toHaveValue('1 200')
    expect(screen.getByLabelText(/^Высота/)).toHaveValue('1 400')
  })

  it('says so when the constructor has no token, and still saves without its image', async () => {
    cc.env.WEBCC_TOKEN = ''
    render('/templates/update/5/update-child/8')
    expect(await screen.findByText(/не задан токен/)).toBeInTheDocument()
    expect(cc.started).toEqual([])
    await waitFor(() => expect(screen.getByLabelText(/^Наименование/)).toHaveValue('Створка'))
    await userEvent.type(screen.getByLabelText(/^Ширина/), '600')
    await userEvent.type(screen.getByLabelText(/^Высота/), '900')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalled())
    expect((await parts(http.put.mock.calls[0][1])).data).toMatchObject({
      id: '8',
      parentId: '5',
      base64Image: null,
    })
  })

  it('deletes a template after confirmation', async () => {
    render()
    const row = (await screen.findByText('Дверь')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Удалить' }),
    )
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/templates/6'))
  })

  it('starts the constructor only once the form is on the page, even if the record is slow', async () => {
    let answer: (value: unknown) => void = () => {}
    http.get.mockImplementation(async (url: string) => {
      if (url === '/v1/templates/5') return new Promise((resolve) => (answer = resolve))
      if (url === '/v1/material-type/list') return { data: [{ id: 3, name: 'ПВХ' }] }
      return { data: { data: [], recordsFiltered: 0 } }
    })
    render('/templates/update/5')
    // Answer only once the record was asked for: a fixed pause raced the lazy page under load
    // (answering before the request left it pending for ever).
    await waitFor(() => expect(http.get).toHaveBeenCalledWith('/v1/templates/5', expect.anything()))
    await new Promise((r) => setTimeout(r, 30))
    expect(cc.started).toEqual([])
    answer({ data: PARENT })
    await waitFor(() => expect(cc.opened).toEqual(['{"shapes":[1]}']))
    expect(screen.queryByText('Не удалось запустить конструктор.')).not.toBeInTheDocument()
  })

  it('starts the parent over after saving: the drawing opens again, the old canvas goes', async () => {
    render('/templates/update/5')
    await waitFor(() => expect(cc.opened).toHaveLength(1))
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalled())
    await waitFor(() => expect(cc.opened).toHaveLength(2))
    expect(cc.destroyed).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('region', { name: 'Дочерние шаблоны' })).toBeInTheDocument()
  })

  it('comes back to the list as it was left, and from a child to its parent', async () => {
    const { router } = render('/templates?templates.page=2')
    const row = (await screen.findByText('Окно 2 створки')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/templates/update/5'))

    // into a child and back: the parent's page
    const children = await screen.findByRole('region', { name: 'Дочерние шаблоны' })
    const child = (await within(children).findByText('Дверь')).closest('tr')!
    await userEvent.click(within(child).getByRole('button', { name: 'Изменить' }))
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/templates/update/5/update-child/6'),
    )
    await userEvent.click(await screen.findByRole('link', { name: 'К родительскому шаблону' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/templates/update/5'))
  })

  it('goes back to the list on its page, sort and search', async () => {
    // enough rows for a second page
    http.post.mockResolvedValue({ data: { data: ROWS, recordsTotal: 45, recordsFiltered: 45 } })
    const { router } = render('/templates?templates.page=2')
    const row = (await screen.findByText('Окно 2 створки')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: 'Изменить' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Отмена' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/templates'))
    expect(router.state.location.search).toBe('?templates.page=2')
  })
})
