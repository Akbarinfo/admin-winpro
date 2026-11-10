import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { fileUrl } from '@/shared/api/files'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { Button, Chip, DataTable, IconButton, Thumbnail, type Column } from '@/shared/ui'
import { matchApi, matchKeys, textureKeys } from './api'
import { ColorSwatch } from './ColorSwatch'
import { TextureMatchDialog } from './TextureMatchDialog'
import type { TextureMatch } from './types'

/**
 * Textures that go with one texture: a small table inside its expanded row,
 * with «Add» in its header (the old «Соответствующие текстуры» panel).
 */
export function TextureMatches({ textureId }: { textureId: number }) {
  const { t } = useTranslation()
  // null — closed; 'new' — adding; a match — editing it.
  const [editing, setEditing] = useState<TextureMatch | 'new' | null>(null)

  // Loaded only when the row is expanded (this component mounts then); cached for the next open.
  const matches = useQuery({
    queryKey: matchKeys.of(textureId),
    queryFn: ({ signal }) => matchApi.list(textureId, signal),
  })

  const del = useConfirmDelete<TextureMatch>({
    remove: (row) => matchApi.remove(row.id),
    invalidate: [...textureKeys.all, 'matches'],
    getName: (row) => row.matchingTextureDto?.name ?? '',
  })

  const columns: Column<TextureMatch>[] = [
    {
      key: 'image',
      title: t('textures.image'),
      className: 'w-20',
      render: (row) => (
        <Thumbnail src={fileUrl('texture', row.matchingTextureDto?.imageId)} className="size-8" />
      ),
    },
    {
      key: 'name',
      title: t('textures.name'),
      className: 'font-medium',
      render: (row) => row.matchingTextureDto?.name ?? '—',
    },
    {
      key: 'color',
      title: t('textures.color'),
      render: (row) => <ColorSwatch color={row.matchingTextureDto?.color} />,
    },
    {
      key: 'side',
      title: t('textures.side'),
      render: (row) => <Chip tone="primary">{t(row.matchingSideType)}</Chip>,
    },
  ]

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line py-2 pr-2 pl-3.5">
        <span className="font-semibold">
          {t('textures.matches')}
          {matches.data && <span className="font-medium text-faint"> · {matches.data.length}</span>}
        </span>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing('new')}>
          {t('textures.match_add')}
        </Button>
      </div>
      <DataTable
        columns={columns}
        rows={matches.data ?? []}
        getRowKey={(row) => row.id}
        loading={matches.isPending}
        fetching={matches.isFetching}
        error={matches.error}
        onRetry={() => matches.refetch()}
        empty={t('textures.matches_empty')}
        skeletonRows={2}
        actions={(row) => (
          <>
            <IconButton label={t('common.edit')} onClick={() => setEditing(row)}>
              <Pencil size={16} />
            </IconButton>
            <IconButton label={t('common.delete')} tone="danger" onClick={() => del.request(row)}>
              <Trash2 size={16} />
            </IconButton>
          </>
        )}
      />
      {del.dialog}
      {editing !== null && (
        <TextureMatchDialog
          textureId={textureId}
          match={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
