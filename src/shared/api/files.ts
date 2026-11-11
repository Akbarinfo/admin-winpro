import { env } from '@/shared/config/env'

/** Folders of /v1/file/{kind}/{id} used by the old panel. */
export type FileKind =
  | 'supplier'
  | 'texture'
  | 'user'
  | 'product'
  | 'template'
  | 'connection'
  | 'profile'
  /** Pictures sent in feedback chats */
  | 'message/img'

/** URL of a stored file (logo, texture image…), or undefined when there is none. Public, no token needed. */
export const fileUrl = (kind: FileKind, id: number | string | null | undefined) =>
  id === null || id === undefined || id === '' ? undefined : `${env.API_URL}/v1/file/${kind}/${id}`

/**
 * Body for endpoints that take a record together with an image (supplier, texture, user):
 * part «data» — the record as a JSON blob, part «image» — the file.
 * Without a new file the old panel still sent an «image» part with the text "null"; kept as is.
 */
export function multipartBody(data: object, image: File | null | undefined) {
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  form.append('image', image ?? 'null')
  return form
}
