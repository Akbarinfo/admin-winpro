import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Fragment, useEffect, useMemo, useReducer, useRef, useState, type UIEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Maximize2, Minimize2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/cn'
import { Alert, Button, IconButton, Input, Modal, Spinner } from '@/shared/ui'
import { akfaApi } from './api'
import { toastClientError } from './helpers'
import {
  EMPTY_DRAFT,
  akfaLabel,
  checkedKeys,
  defaultAkfaQuery,
  draftReducer,
  idEq,
  keysWithChecked,
  textureKey,
  toChanges,
  valueOf,
  type TextureRow,
} from './mappingDraft'
import { AkfaItemRow, TextureItem, type DragData } from './MappingRows'
import type { MappingChange, MappingConflict } from './types'
import {
  fetchTextureRows,
  useAkfaProducts,
  useAllTextures,
  useProductTextures,
  type ProductRef,
} from './useMappingLists'

/** Near the end of a list: load its next page. */
const NEAR_END = 120

function useDebounced(value: string, ms = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return debounced
}

type ConflictItem = { key: string; productName: string; textureName: string; now: string }

type Props = {
  /** One product's textures; without it — every product's (the «+ Маппинг» button). */
  product?: ProductRef
  onClose: () => void
  /** Saved: the tables and counts refresh. */
  onSaved: () => void
}

/**
 * Links WinPro textures to Akfa products (the old AkfaMappingModal): textures on the left, Akfa
 * products on the right; drag one onto the other, or check textures and press «Привязать» on an
 * Akfa product. Changes collect in a draft and go in one PUT /mappings/batch; rows another admin
 * changed meanwhile (409) are listed, and «Обновить и продолжить» takes the server's state for them.
 */
export function MappingDialog({ product, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const global = !product
  const [draft, dispatch] = useReducer(draftReducer, EMPTY_DRAFT)

  const [akfaText, setAkfaText] = useState(global ? '' : defaultAkfaQuery(product.productName))
  const [akfaUnmapped, setAkfaUnmapped] = useState(false)
  const [texText, setTexText] = useState('')
  const [texUnmapped, setTexUnmapped] = useState(false)
  const akfaQuery = useDebounced(akfaText.trim())
  const texQuery = useDebounced(texText.trim())

  const productTextures = useProductTextures(product)
  const allTextures = useAllTextures(texQuery, global)
  const akfaList = useAkfaProducts(akfaQuery, akfaUnmapped)

  // What the lists bring becomes known to the draft (its server state for keys not seen yet).
  const scopeRows = useMemo<TextureRow[]>(
    () =>
      global
        ? (allTextures.data?.pages.flatMap((p) => p.rows) ?? [])
        : (productTextures.data ?? []),
    [global, allTextures.data, productTextures.data],
  )
  const akfaItems = useMemo(
    () => akfaList.data?.pages.flatMap((p) => p.items) ?? [],
    [akfaList.data],
  )
  useEffect(() => dispatch({ type: 'textures', rows: scopeRows }), [scopeRows])
  useEffect(() => dispatch({ type: 'akfaItems', items: akfaItems }), [akfaItems])

  const inScope = (key: string) => global || idEq(draft.meta[key]?.productId, product.productId)
  /** The textures linked to an Akfa product now: the server's that still are, and the draft's. */
  const chipsFor = (item: (typeof akfaItems)[number]) => {
    const keys = new Set<string>()
    for (const row of item.linked) if (idEq(valueOf(draft, row.key), item.id)) keys.add(row.key)
    for (const [key, value] of Object.entries(draft.edits)) if (idEq(value, item.id)) keys.add(key)
    return [...keys].filter(inScope).map((key) => ({ key, ...draft.meta[key] }))
  }

  const visibleTextures =
    global && texUnmapped ? scopeRows.filter((r) => valueOf(draft, r.key) == null) : scopeRows
  const visibleAkfa = akfaItems
    .map((item) => ({ item, chips: chipsFor(item) }))
    .filter((entry) => !akfaUnmapped || entry.chips.length === 0)
  const linked = scopeRows.filter((r) => valueOf(draft, r.key) != null).length
  const changes = Object.keys(draft.edits).length
  const checked = checkedKeys(draft)

  // ---- infinite lists ----
  const texListRef = useRef<HTMLDivElement>(null)
  const akfaListRef = useRef<HTMLDivElement>(null)
  // Not while anything loads, and not after a failed page: that waits for «Повторить»
  // (otherwise a short list would ask again and again, a toast each time).
  const more = (list: typeof akfaList | typeof allTextures) => {
    if (list.hasNextPage && !list.isFetching && !list.isError) void list.fetchNextPage()
  }
  const onNearEnd = (load: () => void) => (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight > el.scrollHeight - NEAR_END) load()
  }
  // A list too short to scroll (a filter hid most of it) loads on by itself, as before.
  useEffect(() => {
    const fill = (el: HTMLDivElement | null, load: () => void) => {
      if (el && el.scrollHeight <= el.clientHeight + NEAR_END) load()
    }
    if (global) fill(texListRef.current, () => more(allTextures))
    fill(akfaListRef.current, () => more(akfaList))
  })

  // ---- closing with unsaved changes ----
  const [confirmClose, setConfirmClose] = useState(false)
  const requestClose = () => (changes > 0 ? setConfirmClose(true) : onClose())

  // ---- drag & drop ----
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 6 } }),
  )
  const [active, setActive] = useState<DragData | null>(null)
  // read synchronously by Escape: dnd-kit cancels the drag before the dialog hears it
  const dragging = useRef(false)
  // a drag that ended on its own row mustn't count as a click (check) on it
  const justDragged = useRef(false)
  const endDrag = () => {
    dragging.current = false
    setActive(null)
    justDragged.current = true
    setTimeout(() => (justDragged.current = false), 0)
  }

  const assign = (keys: string[], akfaId: number) => {
    // a texture already linked gets the new one instead (N:1)
    dispatch({ type: 'assign', keys, akfaId })
    setConfirmClose(false)
    toast.info(
      t('akfa.mappingModal.dropped', { count: keys.length, akfa: akfaLabel(draft.akfa[akfaId]) }),
    )
  }
  const onDragStart = ({ active: a }: DragStartEvent) => {
    dragging.current = true
    setActive(a.data.current as DragData)
  }
  const onDragEnd = ({ active: a, over }: DragEndEvent) => {
    const source = a.data.current as DragData
    endDrag()
    const target = over?.data.current as DragData | undefined
    if (!target) return
    if (source.kind === 'tex' && target.kind === 'akfa')
      assign(keysWithChecked(draft, source.key), target.akfaId)
    else if (source.kind === 'akfa' && target.kind === 'tex')
      assign(keysWithChecked(draft, target.key), source.akfaId)
  }
  const dragLabel = () => {
    if (!active) return ''
    if (active.kind === 'akfa') return akfaLabel(draft.akfa[active.akfaId])
    const keys = keysWithChecked(draft, active.key)
    const first = draft.meta[keys[0]]?.textureName ?? ''
    return keys.length > 1 ? `${first} +${keys.length - 1}` : first
  }

  // ---- saving and conflicts ----
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState<{ keys: string[]; items: ConflictItem[] } | null>(null)

  /** The server's rows of the products a save touched (and the dialog's own product). */
  const serverRows = (list: MappingChange[]) => {
    const ids = new Map<string, number>()
    for (const c of list) ids.set(String(c.productId), c.productId)
    if (product) ids.set(String(product.productId), product.productId)
    const products = [...ids.values()].map((productId) =>
      product && idEq(productId, product.productId)
        ? product
        : {
            productId,
            productName: Object.values(draft.meta).find((m) => idEq(m.productId, productId))
              ?.productName,
          },
    )
    return fetchTextureRows(products)
  }

  const showConflict = async (
    list: MappingChange[],
    fromServer?: MappingConflict[] | null,
    message?: string | null,
  ) => {
    let rows: TextureRow[]
    try {
      rows = await serverRows(list)
    } catch {
      // as before: the state couldn't be loaded
      return toast.error(t('akfa.common.load_error'))
    }
    const server = Object.fromEntries(rows.map((r) => [r.key, r]))
    // what the server has now differs from what was loaded
    let keys = Object.keys(draft.edits).filter(
      (key) => !idEq(server[key]?.akfaProductId, draft.orig[key] ?? null),
    )
    if (keys.length === 0 && fromServer?.length)
      keys = fromServer.map((c) => textureKey(c.productId, c.textureId))
    if (keys.length === 0) return toast.error(message || t('akfa.mappingModal.conflict_generic'))
    setConfirmClose(false)
    setConflict({
      keys,
      items: keys.map((key) => {
        const now = server[key]?.akfa
        return {
          key,
          productName: server[key]?.productName || draft.meta[key]?.productName || '',
          textureName: server[key]?.textureName || draft.meta[key]?.textureName || '',
          now: now
            ? akfaLabel({ ...now, ...draft.akfa[now.id] })
            : t('akfa.mapping.winpro_unmapped').toLowerCase(),
        }
      }),
    })
  }

  const save = async () => {
    if (changes === 0 || saving) return
    const list = toChanges(draft)
    setSaving(true)
    try {
      const result = await akfaApi.saveMappings(list)
      if (result.conflict)
        return await showConflict(list, result.body?.conflicts, result.body?.message)
      toast.success(
        t('akfa.mappingModal.saved', {
          name: product ? product.productName : t('akfa.mappingModal.title_global'),
          count: list.length,
        }),
      )
      onClose()
      onSaved()
    } catch (e) {
      toastClientError(e, t('akfa.common.action_error'))
    } finally {
      setSaving(false)
    }
  }

  /** The server's state for the conflicting rows; the other changes stay in the draft. */
  const refreshAndContinue = async () => {
    if (!conflict) return
    try {
      const rows = await serverRows(toChanges(draft))
      dispatch({ type: 'serverState', rows, conflictKeys: conflict.keys })
      await Promise.all([
        global ? allTextures.refetch() : productTextures.refetch(),
        akfaList.refetch(),
      ])
      setConflict(null)
      toast.info(t('akfa.mappingModal.refreshed'))
    } catch (e) {
      toastClientError(e, t('akfa.common.load_error'))
    }
  }

  // ---- layout ----
  const [maximized, setMaximized] = useState(false)
  const texLoading = global ? allTextures.isPending : productTextures.isPending
  const texError = global ? allTextures.error : productTextures.error

  const title = product ? product.productName : t('akfa.mappingModal.title_global')
  const description = (
    <span className="grid gap-1">
      <span>
        {product
          ? t('akfa.mappingModal.sub_product', {
              article: product.article || '—',
              linked,
              total: scopeRows.length,
            })
          : t('akfa.mappingModal.sub_global', { linked, total: scopeRows.length })}
      </span>
      {product && (product.supplierName || product.productSeriesName) && (
        <span className="flex flex-wrap gap-1.5">
          {product.supplierName && (
            <span className="rounded-md bg-surface-2 px-1.5 py-0.5">
              {t('akfa.mapping.col_supplier')}: <b className="text-fg">{product.supplierName}</b>
            </span>
          )}
          {product.productSeriesName && (
            <span className="rounded-md bg-surface-2 px-1.5 py-0.5">
              {t('akfa.mapping.col_series')}: <b className="text-fg">{product.productSeriesName}</b>
            </span>
          )}
        </span>
      )}
    </span>
  )

  const onlyUnmapped = (value: boolean, set: (v: boolean) => void) => (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs whitespace-nowrap text-muted">
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={value}
        onChange={(e) => set(e.target.checked)}
      />
      {t('akfa.mappingModal.only_unmapped')}
    </label>
  )

  const status = (
    loading: boolean,
    empty: boolean,
    emptyText: string,
    error: unknown,
    retry: () => void,
  ) =>
    loading ? (
      <div className="grid place-items-center py-6 text-primary">
        <Spinner />
      </div>
    ) : error ? (
      <Alert>
        {t('akfa.common.load_error')}{' '}
        <button type="button" onClick={retry} className="font-medium underline">
          {t('common.retry')}
        </button>
      </Alert>
    ) : empty ? (
      <p className="py-8 text-center text-sm text-faint">{emptyText}</p>
    ) : null

  return (
    <Modal
      open
      size={maximized ? 'full' : 'xl'}
      // during a drag Escape only cancels the drag
      onClose={() => !dragging.current && !justDragged.current && requestClose()}
      title={title}
      description={description}
      headerActions={
        <IconButton
          label={t(maximized ? 'akfa.common.restore' : 'akfa.common.maximize')}
          onClick={() => setMaximized((v) => !v)}
        >
          {maximized ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </IconButton>
      }
      bodyClassName="flex min-h-0 flex-1 flex-col"
      footer={
        confirmClose ? (
          <>
            <span
              role="alert"
              className="min-w-[220px] flex-1 self-center text-sm font-semibold text-warn"
            >
              {t('akfa.mappingModal.unsaved_warning', { count: changes })}
            </span>
            <Button variant="outline" onClick={() => setConfirmClose(false)}>
              {t('akfa.mappingModal.stay')}
            </Button>
            <Button variant="danger" onClick={onClose}>
              {t('akfa.mappingModal.discard')}
            </Button>
          </>
        ) : (
          <>
            <span className="min-w-[220px] flex-1 self-center text-xs text-muted">
              {changes > 0 && (
                <>
                  <b className="text-fg">{t('akfa.mappingModal.changes', { count: changes })}</b>{' '}
                  ·{' '}
                </>
              )}
              {t('akfa.mappingModal.hint')}
            </span>
            <Button variant="outline" onClick={requestClose}>
              {t('common.cancel')}
            </Button>
            <Button loading={saving} disabled={changes === 0} onClick={save}>
              {t(saving ? 'common.saving' : 'common.save')}
            </Button>
          </>
        )
      }
    >
      {conflict && (
        <div
          role="alert"
          className="flex shrink-0 flex-wrap items-start justify-between gap-3.5 border-b border-line bg-warn-soft px-4 py-3 text-sm"
        >
          <div>
            <b className="text-warn">
              {t('akfa.mappingModal.conflict_title', { count: conflict.items.length })}
            </b>{' '}
            {t('akfa.mappingModal.conflict_text')}
            <ul className="mt-1.5 list-disc pl-5">
              {conflict.items.map((item) => (
                <li key={item.key}>
                  {item.productName} · {item.textureName} — {t('akfa.mappingModal.conflict_now')}{' '}
                  {item.now}
                </li>
              ))}
            </ul>
          </div>
          <Button onClick={refreshAndContinue}>{t('akfa.mappingModal.conflict_refresh')}</Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={endDrag}
      >
        <div
          className={cn(
            'grid min-h-0 flex-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1',
            active && 'cursor-grabbing',
          )}
        >
          {/* left — WinPro textures */}
          <section aria-labelledby="map-tex" className="flex min-h-0 min-w-0 flex-col">
            <div className="flex min-h-[54px] shrink-0 flex-wrap items-center gap-2.5 border-b border-line px-3.5 py-2.5">
              <h4
                id="map-tex"
                className={
                  global
                    ? 'sr-only'
                    : 'flex-1 text-xs font-semibold tracking-wide text-faint uppercase'
                }
              >
                {t('akfa.mappingModal.textures_label')}
              </h4>
              {global && (
                <Input
                  type="search"
                  autoFocus
                  aria-label={t('akfa.mappingModal.tex_search')}
                  placeholder={t('akfa.mappingModal.tex_search')}
                  value={texText}
                  onChange={(e) => setTexText(e.target.value)}
                  className="min-w-0 flex-1 basis-40"
                />
              )}
              {checked.length > 0 && (
                <span className="text-xs text-muted tabular-nums">
                  {t('akfa.mappingModal.checked', { count: checked.length })}
                </span>
              )}
              {global && onlyUnmapped(texUnmapped, setTexUnmapped)}
            </div>
            <div
              ref={texListRef}
              onScroll={global ? onNearEnd(() => more(allTextures)) : undefined}
              className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2"
            >
              {visibleTextures.map((row, i) => {
                const value = valueOf(draft, row.key)
                // global mode: each product's textures under its name
                const header = global && row.productId !== visibleTextures[i - 1]?.productId
                return (
                  <Fragment key={row.key}>
                    {header && (
                      <p className="px-2.5 pt-3 pb-1 text-xs font-bold text-muted first:pt-1">
                        {row.productName}
                      </p>
                    )}
                    <TextureItem
                      row={row}
                      akfa={value != null ? (draft.akfa[value] ?? { id: value }) : null}
                      checked={!!draft.checked[row.key]}
                      dragKind={active?.kind ?? null}
                      onToggle={() =>
                        !justDragged.current && dispatch({ type: 'toggleCheck', key: row.key })
                      }
                      onUnlink={() => {
                        dispatch({ type: 'unlink', key: row.key })
                        setConfirmClose(false)
                      }}
                    />
                  </Fragment>
                )
              })}
              {status(
                texLoading || (global && allTextures.isFetchingNextPage),
                visibleTextures.length === 0,
                t(
                  global
                    ? 'akfa.mappingModal.no_textures_found'
                    : 'akfa.mappingModal.no_textures_in_product',
                ),
                texError,
                () =>
                  void (global
                    ? allTextures.data
                      ? allTextures.fetchNextPage()
                      : allTextures.refetch()
                    : productTextures.refetch()),
              )}
            </div>
          </section>

          {/* right — Akfa products */}
          <section
            aria-labelledby="map-akfa"
            className="flex min-h-0 min-w-0 flex-col border-t border-line md:border-t-0 md:border-l"
          >
            <div className="flex min-h-[54px] shrink-0 flex-wrap items-center gap-2.5 border-b border-line px-3.5 py-2.5">
              <h4
                id="map-akfa"
                className="text-xs font-semibold tracking-wide text-faint uppercase"
              >
                {t('akfa.mapping.subtab_akfa')}
              </h4>
              <Input
                type="search"
                autoFocus={!global}
                aria-label={t('akfa.mappingModal.akfa_search')}
                placeholder={t('akfa.mappingModal.akfa_search')}
                value={akfaText}
                onChange={(e) => setAkfaText(e.target.value)}
                className="min-w-0 flex-1 basis-40"
              />
              {onlyUnmapped(akfaUnmapped, setAkfaUnmapped)}
            </div>
            <div
              ref={akfaListRef}
              onScroll={onNearEnd(() => more(akfaList))}
              className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2"
            >
              {visibleAkfa.map(({ item, chips }) => (
                <AkfaItemRow
                  key={item.id}
                  item={item}
                  chips={chips}
                  global={global}
                  dragKind={active?.kind ?? null}
                  checkedCount={checked.length}
                  onLinkChecked={() => assign(checked, item.id)}
                  onUnlink={(key) => {
                    dispatch({ type: 'unlink', key })
                    setConfirmClose(false)
                  }}
                />
              ))}
              {status(
                akfaList.isPending || akfaList.isFetchingNextPage,
                visibleAkfa.length === 0,
                t('akfa.mappingModal.no_akfa_found'),
                akfaList.error,
                () => void (akfaList.data ? akfaList.fetchNextPage() : akfaList.refetch()),
              )}
            </div>
          </section>
        </div>

        <DragOverlay dropAnimation={null}>
          {active && (
            <div className="pointer-events-none inline-block max-w-[320px] cursor-grabbing truncate rounded-lg bg-fg px-3 py-1.5 text-xs font-semibold text-surface shadow-lg">
              {dragLabel()}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </Modal>
  )
}
