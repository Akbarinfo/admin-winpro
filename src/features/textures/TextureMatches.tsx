import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { fileUrl } from '@/shared/api/files'
import { useConfirmDelete } from '@/shared/hooks/useConfirmDelete'
import { Button, Card, DataTable, IconButton, Thumbnail, type Column } from '@/shared/ui'
import { matchApi, textureKeys } from './api'
import { ColorSwatch } from './ColorSwatch'
import { TextureMatchDialog } from './TextureMatchDialog'
import type { TextureMatch } from './types'

/** Textures that go with the selected one (the old «Соответствующие текстуры» panel). */
export function TextureMatches({ textureId }: { textureId: number | null }) {
  const { t } = useTranslation()
  // null — closed; 'new' — adding; a match — editing it.
  const [editing, setEditing] = useState<TextureMatch | 'new' | null>(null)

  const matches = useQuery({
    queryKey: [...textureKeys.all, 'matches', textureId],
    queryFn: ({ signal }) => matchApi.list(textureId!, signal),
    enabled: textureId !== null,
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
      render: (row) => <Thumbnail src={fileUrl('texture', row.matchingTextureDto?.imageId)} />,
    },
    {
      key: 'name',
      title: t('textures.name'),
      render: (row) => row.matchingTextureDto?.name ?? '—',
    },
    {
      key: 'color',
      title: t('textures.color'),
      render: (row) => <ColorSwatch color={row.matchingTextureDto?.color} />,
    },
    { key: 'side', title: t('textures.side'), render: (row) => t(row.matchingSideType) },
  ]

  return (
    <Card className="mt-4 flex max-h-[40%] min-h-[180px] shrink-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <h2 className="font-semibold">{t('textures.matches')}</h2>
        <Button
          size="sm"
          variant="outline"
          icon={<Plus size={14} />}
          disabled={textureId === null}
          onClick={() => setEditing('new')}
        >
          {t('textures.match_add')}
        </Button>
      </div>
      {textureId === null ? (
        <p className="px-4 py-8 text-center text-muted">{t('textures.matches_hint')}</p>
      ) : (
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
      )}
      {del.dialog}
      {editing !== null && textureId !== null && (
        <TextureMatchDialog
          textureId={textureId}
          match={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  )
}
