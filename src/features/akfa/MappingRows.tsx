import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useCallback, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { GripVertical, Link2, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui'
import { formatPrice } from './helpers'
import type { AkfaInfo, AkfaItem, TextureRow } from './mappingDraft'

/** What is dragged or dropped on: a texture (by its key) or an Akfa product. */
export type DragData = { kind: 'tex'; key: string } | { kind: 'akfa'; akfaId: number }

/** A click inside these isn't a drag or a row click. */
const isControl = (target: EventTarget) => !!(target as HTMLElement).closest('button, input, label')

/**
 * A row that is dragged and dropped on. The mouse drags it from anywhere; a finger only from the
 * ⠿ handle (elsewhere the list scrolls as usual) — as before.
 */
function useDragDrop(dragId: string, dropId: string, data: DragData, dropEnabled: boolean) {
  const drag = useDraggable({ id: dragId, data })
  const drop = useDroppable({ id: dropId, data, disabled: !dropEnabled })
  const { setNodeRef: setDragRef } = drag
  const { setNodeRef: setDropRef } = drop
  const setNode = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node)
      setDropRef(node)
    },
    [setDragRef, setDropRef],
  )
  const onMouseDown = (e: MouseEvent) => {
    if (isControl(e.target)) return
    drag.listeners?.onMouseDown?.(e)
  }
  const handle = {
    onTouchStart: (e: React.TouchEvent) => drag.listeners?.onTouchStart?.(e),
    style: { touchAction: 'none' as const },
  }
  return { setNode, onMouseDown, handle, isDragging: drag.isDragging, isOver: drop.isOver }
}

const rowClass = (isOver: boolean, target: boolean, dragging: boolean) =>
  cn(
    'flex select-none gap-2.5 rounded-lg border px-2.5 py-2',
    isOver
      ? 'border-primary bg-primary-soft'
      : target
        ? 'border-dashed border-line-strong'
        : 'border-transparent',
    dragging && 'opacity-40',
  )

type TextureRowProps = {
  row: TextureRow
  akfa: AkfaInfo | null
  checked: boolean
  /** What is being dragged now: an Akfa product makes this row a target. */
  dragKind: DragData['kind'] | null
  onToggle: () => void
  onUnlink: () => void
}

/** A WinPro texture and the Akfa product it's linked to (or a place to drop one). */
export function TextureItem({ row, akfa, checked, dragKind, onToggle, onUnlink }: TextureRowProps) {
  const { t } = useTranslation()
  const { setNode, onMouseDown, handle, isDragging, isOver } = useDragDrop(
    `tex:${row.key}`,
    `drop-tex:${row.key}`,
    { kind: 'tex', key: row.key },
    dragKind === 'akfa',
  )
  return (
    <div
      ref={setNode}
      onMouseDown={onMouseDown}
      // a click on the row checks it (as before); its controls do their own thing
      onClick={(e) => !isControl(e.target) && onToggle()}
      className={cn(
        rowClass(isOver, dragKind === 'akfa', isDragging),
        'cursor-grab items-center',
        !isOver && (checked ? 'bg-primary-soft' : 'hover:bg-primary-soft/60'),
      )}
    >
      <input
        type="checkbox"
        className="size-4 shrink-0 accent-primary"
        checked={checked}
        onChange={onToggle}
        aria-label={t('akfa.mappingModal.check_aria', {
          name: `${row.productName} · ${row.textureName}`,
        })}
      />
      <span {...handle} className="-m-1.5 inline-flex shrink-0 p-1.5 text-faint" aria-hidden="true">
        <GripVertical size={14} />
      </span>
      <span className="min-w-[120px] text-sm font-semibold">{row.textureName}</span>
      {row.price != null && (
        <span className="shrink-0 text-xs whitespace-nowrap text-muted tabular-nums">
          {formatPrice(row.price, row.currency)}
        </span>
      )}
      <span aria-hidden="true" className="text-faint">
        →
      </span>
      {akfa ? (
        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-ok-soft py-0.5 pr-0.5 pl-2 text-xs text-ok">
          <span className="min-w-0 flex-1 truncate" title={akfa.name}>
            <b>{akfa.externalId ?? `#${akfa.id}`}</b> {akfa.name}
          </span>
          <button
            type="button"
            onClick={onUnlink}
            aria-label={t('akfa.mappingModal.unlink_chip_aria', { name: row.textureName })}
            className="grid size-6 shrink-0 place-items-center rounded hover:bg-surface"
          >
            <X size={13} />
          </button>
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate rounded-md border border-dashed border-line-strong px-2 py-1 text-xs text-faint">
          {t('akfa.mappingModal.drop_here')}
        </span>
      )}
    </div>
  )
}

type AkfaRowProps = {
  item: AkfaItem
  /** The textures linked to it now (the server's, with the draft's changes). */
  chips: { key: string; productName?: string; textureName?: string }[]
  /** Global mode names each chip's product too. */
  global: boolean
  dragKind: DragData['kind'] | null
  /** Checked textures: a button links them here without dragging. */
  checkedCount: number
  onLinkChecked: () => void
  onUnlink: (key: string) => void
}

/** An Akfa product: drag it onto a texture, or drop textures on it. */
export function AkfaItemRow({
  item,
  chips,
  global,
  dragKind,
  checkedCount,
  onLinkChecked,
  onUnlink,
}: AkfaRowProps) {
  const { t } = useTranslation()
  const { setNode, onMouseDown, handle, isDragging, isOver } = useDragDrop(
    `akfa:${item.id}`,
    `drop-akfa:${item.id}`,
    { kind: 'akfa', akfaId: item.id },
    dragKind === 'tex',
  )
  return (
    <div
      ref={setNode}
      onMouseDown={onMouseDown}
      className={cn(
        rowClass(isOver, dragKind === 'tex', isDragging),
        'cursor-grab items-start',
        !isOver && 'hover:bg-primary-soft/60',
      )}
    >
      <span
        {...handle}
        className="-m-1.5 mt-0 inline-flex shrink-0 p-1.5 text-faint"
        aria-hidden="true"
      >
        <GripVertical size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="line-clamp-2 min-w-0 flex-1 text-sm break-words" title={item.name}>
            <span className="text-xs text-muted">{item.externalId ?? `#${item.id}`}</span>{' '}
            {item.name}
          </div>
          {item.price != null && (
            <span className="shrink-0 pt-0.5 text-xs whitespace-nowrap text-muted tabular-nums">
              {formatPrice(item.price, item.currency)}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {item.groupName && (
            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-muted">
              {item.groupName}
            </span>
          )}
          {checkedCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              icon={<Link2 size={13} />}
              className="ml-auto h-7"
              onClick={onLinkChecked}
            >
              {t('akfa.link_checked', { count: checkedCount })}
              {/* what it links to, for screen readers (the visible text starts the name) */}
              <span className="sr-only"> → {item.name}</span>
            </Button>
          )}
        </div>
        {chips.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {chips.map((chip) => (
              <li
                key={chip.key}
                className="inline-flex items-center gap-0.5 rounded-md bg-primary-soft py-px pr-0.5 pl-2 text-xs font-semibold text-primary-strong"
              >
                {chip.textureName}
                {global && chip.productName ? ` · ${chip.productName}` : ''}
                <button
                  type="button"
                  onClick={() => onUnlink(chip.key)}
                  aria-label={t('akfa.mappingModal.unlink_chip_aria', { name: chip.textureName })}
                  className="grid size-5 place-items-center rounded hover:bg-surface"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
