import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { renderWithProviders } from '@/test/render'
import { profileSystemRoutes } from './index'

// The real profileSystemApi runs against a mocked HTTP client, so endpoints and bodies are checked too.
vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }))
const http = vi.mocked(api)

const TREE = [
  {
    id: 1,
    name: 'Akfa',
    children: [
      { id: 11, name: 'Termo 70', children: [{ id: 111, name: 'Termo 70 Lux' }] },
      { id: 12, name: 'Termo 60' },
    ],
  },
  { id: 2, name: 'Enwin' },
]

const TERMO_70 = {
  id: 11,
  name: 'Termo 70',
  defaultGlassId: 501,
  defaultPanelId: 502,
  fillingGroupId: 7,
  materialTypeId: 3,
  supplierId: 4,
  isVisible: true,
  isDefault: false,
  isTesting: true,
  visibility: 'PRIVATE',
  slidingType: 'FRAME_PER_TRACK',
  clientScope: 'V2_ONLY',
  sashClearance: 0,
  maxTrackCount: 3,
  imageId: 900,
  profileSystemFullInfo: {
    id: 55,
    characteristics: [{ key: 'char.depth', value: 'char.depth.70' }],
  },
}

const GETS: Record<string, unknown> = {
  '/v1/profile/system/list/tree': TREE,
  '/v1/profile/system/11': TERMO_70,
  '/v1/profile/system/111': { id: 111, name: 'Termo 70 Lux' },
  '/v1/filling/group/list': [{ id: 7, name: 'Стандарт' }],
  '/v1/product/article/filling': [
    { id: 501, name: 'Стеклопакет 4-16-4' },
    { id: 502, name: 'Сэндвич 24' },
  ],
  '/v1/material-type/list': [{ id: 3, name: 'ПВХ' }],
  '/v1/profile/system/enum/sliding/type': [
    { name: 'NONE' },
    { name: 'FRAME_PER_TRACK' },
    { name: 'MULTI_TRACK_FRAME' },
  ],
  '/v1/profile/system/enum/client/scope': [{ name: 'ALL' }, { name: 'V2_ONLY' }],
  '/v1/country/list': [],
  '/v1/country-translation/PROFILE_SYSTEM/11': [],
}

// The form's own field, not the translation table's «Наименование — Kazakhstan».
const NAME = /^Наименование(?! —)/

const dataPart = async (body: FormData) => JSON.parse(await (body.get('data') as Blob).text())
const render = (url = '/profile_system') =>
  renderWithProviders(<></>, { url, routes: profileSystemRoutes })

beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockImplementation(async (url: string) => {
    if (url in GETS) return { data: GETS[url] }
    throw new Error(`unexpected GET ${url}`)
  })
  http.post.mockImplementation(async (url: string) => {
    if (url === '/v1/supplier/table') return { data: { data: [{ id: 4, name: 'Akfa' }] } }
    if (url === '/v1/profile/system') return { data: { id: 13 } }
    return { data: {} }
  })
  http.put.mockResolvedValue({ data: {} })
  http.delete.mockResolvedValue({ data: {} })
})

describe('Profile systems', () => {
  it('shows the tree, opens a branch and chooses a system', async () => {
    const { router } = render()
    const tree = await screen.findByRole('tree', { name: 'Системы профилей' })
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(2)
    // a branch shows how many systems it holds, outside its name
    expect(within(tree).getByRole('treeitem', { name: 'Akfa' })).toHaveTextContent(/^Akfa2$/)
    expect(within(tree).getByRole('treeitem', { name: 'Enwin' })).toBeInTheDocument()

    // the chevron opens a branch without choosing it
    await userEvent.click(within(tree).getAllByTestId('tree-branch')[0])
    expect(within(tree).getByRole('treeitem', { name: 'Termo 70' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('')

    await userEvent.click(within(tree).getByRole('treeitem', { name: 'Termo 70' }))
    expect(router.state.location.search).toBe('?system=11')
    expect(within(tree).getByRole('treeitem', { name: 'Termo 70' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('heading', { name: 'Termo 70' })).toBeInTheDocument()
    expect(screen.getByText('Akfa', { selector: 'p' })).toBeInTheDocument() // its parent
    // the parts come later in the migration; the defaults are in their own tab
    expect(screen.getByRole('tab', { name: 'Спецификация' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Раздел переносится на следующем шаге')
    await userEvent.click(screen.getByRole('tab', { name: 'Заполнение' }))
    expect(router.state.location.search).toBe('?system=11&tab=filling')
    expect(await screen.findByText('Стеклопакет 4-16-4')).toBeInTheDocument()
    expect(screen.getByText('Стандарт')).toBeInTheDocument()
  })

  it('finds systems by name: the matches with the way to them', async () => {
    render()
    const tree = await screen.findByRole('tree')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Найти систему…' }), 'lux')
    await waitFor(() =>
      expect(within(tree).getAllByRole('treeitem').map((n) => n.getAttribute('aria-level'))).toEqual(
        ['1', '2', '3'],
      ),
    )
    expect(within(tree).getByRole('treeitem', { name: 'Termo 70 Lux' })).toBeInTheDocument()
    expect(within(tree).queryByRole('treeitem', { name: 'Enwin' })).not.toBeInTheDocument()

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Найти систему…' }))
    await userEvent.type(screen.getByRole('searchbox', { name: 'Найти систему…' }), 'нет')
    expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument()
  })

  it('opens the way to a system given by a link, and expands all', async () => {
    render('/profile_system?system=111')
    const tree = await screen.findByRole('tree')
    expect(await within(tree).findByRole('treeitem', { name: 'Termo 70 Lux' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Свернуть все' }))
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Развернуть все' }))
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(5)
  })

  it('moves through the tree from the keyboard', async () => {
    const { router } = render()
    const tree = await screen.findByRole('tree')
    within(tree).getByRole('treeitem', { name: 'Akfa' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(within(tree).getByRole('treeitem', { name: 'Akfa' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(router.state.location.search).toBe('?system=11')
  })

  it('adds a system under a parent: multipart data + file, no characteristics', async () => {
    render()
    await screen.findByRole('tree')
    await userEvent.click(screen.getByRole('button', { name: 'Добавить системный профиль' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(NAME), 'Termo 80')
    await userEvent.click(within(dialog).getByLabelText('Родительская система'))
    await userEvent.click(await screen.findByRole('option', { name: 'Akfa / Termo 70' }))
    await userEvent.selectOptions(
      within(dialog).getByLabelText('Тип раздвижной системы'),
      'FRAME_PER_TRACK',
    )
    await userEvent.type(within(dialog).getByLabelText('Максимум направляющих'), '4')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith('/v1/profile/system', expect.any(FormData)),
    )
    const body = http.post.mock.calls.find(([u]) => u === '/v1/profile/system')![1] as FormData
    expect(await dataPart(body)).toEqual({
      id: null,
      name: 'Termo 80',
      parentId: 11,
      defaultGlassId: null,
      defaultPanelId: null,
      fillingGroupId: null,
      materialTypeId: null,
      isVisible: false,
      isDefault: false,
      supplierId: null,
      visibility: 'PUBLIC',
      slidingType: 'FRAME_PER_TRACK',
      isTesting: false,
      clientScope: 'ALL',
      sashClearance: null,
      maxTrackCount: 4,
      specifications: [],
    })
    expect(body.get('file')).toBe('null')
    // no characteristics — nothing to save there (as the old modal)
    expect(http.post).not.toHaveBeenCalledWith('/v1/profile-system-full-info', expect.anything())
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('edits a system: parent locked and sent as null, characteristics kept', async () => {
    render('/profile_system?system=11&tab=filling')
    await screen.findByText('Стеклопакет 4-16-4')
    await userEvent.click(screen.getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(within(dialog).getByLabelText(NAME)).toHaveValue('Termo 70'))
    expect(within(dialog).getByLabelText('Родительская система')).toBeDisabled()
    expect(within(dialog).getByLabelText('Доступно в версии')).toHaveValue('V2_ONLY')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/profile/system', expect.any(FormData)),
    )
    expect(await dataPart(http.put.mock.calls[0][1] as FormData)).toEqual({
      id: '11',
      name: 'Termo 70',
      parentId: null,
      defaultGlassId: 501,
      defaultPanelId: 502,
      fillingGroupId: 7,
      materialTypeId: 3,
      isVisible: true,
      isDefault: false,
      supplierId: 4,
      visibility: 'PRIVATE',
      slidingType: 'FRAME_PER_TRACK',
      isTesting: true,
      clientScope: 'V2_ONLY',
      sashClearance: 0,
      maxTrackCount: 3,
      specifications: [{ key: 'char.depth', value: 'char.depth.70' }],
    })
    await waitFor(() =>
      expect(http.put).toHaveBeenCalledWith('/v1/profile-system-full-info', {
        id: 55,
        profileSystemId: 11,
        characteristics: [{ key: 'char.depth', value: 'char.depth.70' }],
      }),
    )
  })

  it('sends no track limit for a warm sliding system', async () => {
    render('/profile_system?system=11&tab=filling')
    await screen.findByText('Стеклопакет 4-16-4')
    await userEvent.click(screen.getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(within(dialog).getByLabelText(NAME)).toHaveValue('Termo 70'))
    await userEvent.selectOptions(
      within(dialog).getByLabelText('Тип раздвижной системы'),
      'MULTI_TRACK_FRAME',
    )
    expect(within(dialog).getByLabelText('Максимум направляющих')).toBeDisabled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalled())
    expect(await dataPart(http.put.mock.calls[0][1] as FormData)).toMatchObject({
      slidingType: 'MULTI_TRACK_FRAME',
      maxTrackCount: null,
    })
  })

  it('requires a name', async () => {
    render()
    await screen.findByRole('tree')
    await userEvent.click(screen.getByRole('button', { name: 'Добавить системный профиль' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    expect(await within(dialog).findByText('Заполните это поле')).toBeInTheDocument()
    expect(http.post).not.toHaveBeenCalledWith('/v1/profile/system', expect.anything())
  })

  it('deletes the chosen system and clears the choice', async () => {
    const { router } = render('/profile_system?system=11&tab=filling')
    await screen.findByText('Стеклопакет 4-16-4')
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Удалить' }),
    )
    const asked = () => http.get.mock.calls.filter(([u]) => u === '/v1/profile/system/11').length
    const before = asked()
    await waitFor(() => expect(http.delete).toHaveBeenCalledWith('/v1/profile/system/11'))
    // the choice is cleared; the tab stays for the next system
    await waitFor(() => expect(router.state.location.search).toBe('?tab=filling'))
    // the tree is asked again, the deleted system is not
    await waitFor(() =>
      expect(
        http.get.mock.calls.filter(([u]) => u === '/v1/profile/system/list/tree'),
      ).toHaveLength(2),
    )
    expect(asked()).toBe(before)
  })

  it('saves a new system’s picture and translations under the id from the answer', async () => {
    GETS['/v1/country/list'] = [{ id: 1, name: 'Kazakhstan' }]
    try {
      render()
      await screen.findByRole('tree')
      await userEvent.click(screen.getByRole('button', { name: 'Добавить системный профиль' }))
      const dialog = await screen.findByRole('dialog')
      await userEvent.type(within(dialog).getByLabelText(NAME), 'Termo 80')
      await userEvent.click(await within(dialog).findByRole('checkbox', { name: /Kazakhstan/ }))
      await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))

      await waitFor(() =>
        expect(http.post).toHaveBeenCalledWith('/v1/country-translation/batch', [
          {
            id: null,
            entityType: 'PROFILE_SYSTEM',
            entityId: 13,
            countryId: 1,
            field: 'NAME',
            value: 'Termo 80',
          },
        ]),
      )
    } finally {
      GETS['/v1/country/list'] = []
    }
  })

  it('closes the dialog when the translations fail, so the system isn’t added twice', async () => {
    GETS['/v1/country/list'] = [{ id: 1, name: 'Kazakhstan' }]
    http.post.mockImplementation(async (url: string) => {
      if (url === '/v1/supplier/table') return { data: { data: [] } }
      if (url === '/v1/profile/system') return { data: { id: 13 } }
      if (url === '/v1/country-translation/batch') throw new Error('boom')
      return { data: {} }
    })
    try {
      render()
      await screen.findByRole('tree')
      await userEvent.click(screen.getByRole('button', { name: 'Добавить системный профиль' }))
      const dialog = await screen.findByRole('dialog')
      await userEvent.type(within(dialog).getByLabelText(NAME), 'Termo 80')
      await userEvent.click(await within(dialog).findByRole('checkbox', { name: /Kazakhstan/ }))
      await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(http.post.mock.calls.filter(([u]) => u === '/v1/profile/system')).toHaveLength(1)
    } finally {
      GETS['/v1/country/list'] = []
    }
  })

  it('sends a new picture in the «file» part', async () => {
    render('/profile_system?system=11&tab=filling')
    await screen.findByText('Стеклопакет 4-16-4')
    await userEvent.click(screen.getByRole('button', { name: 'Изменить' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(within(dialog).getByLabelText(NAME)).toHaveValue('Termo 70'))
    await userEvent.upload(
      within(dialog).getByLabelText(/Изображение контента/),
      new File(['png'], 'termo.png', { type: 'image/png' }),
    )
    // the crop step: keep the original
    const crop = await screen.findAllByRole('dialog')
    const keep = within(crop[crop.length - 1]).queryByRole('button', { name: /оригинал/i })
    if (keep) await userEvent.click(keep)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Сохранить' }))
    await waitFor(() => expect(http.put).toHaveBeenCalled())
    expect((http.put.mock.calls[0][1] as FormData).get('file')).toBeInstanceOf(File)
  })
})
