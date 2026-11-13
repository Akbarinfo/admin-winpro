import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { i18n } from '@/shared/i18n'
import { useSession } from '@/shared/store/session'

export class ApiError extends Error {
  readonly status: number
  /** Validation errors: field name → message */
  readonly fields?: Record<string, string>
  /**
   * Every text the backend sent (error, message, code), joined — for matching error codes
   * that may sit in any of them (e.g. Spring: { error: "Bad Request", message: "bucket.not.found" }).
   */
  readonly details: string

  constructor(status: number, message: string, fields?: Record<string, string>, details = message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
    this.details = details
  }
}

/** 4xx: the user can fix it, so the page shows the message next to the form. */
export const isClientError = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.status >= 400 && error.status < 500

// The backend answers with { error }, sometimes plain text (e.g. /reset/password).
type ErrorBody =
  | string
  | {
      error?: string
      message?: string
      code?: string
      errors?: Record<string, string>
      timestamp?: unknown
      path?: unknown
    }
  | undefined

export function normalizeError(error: AxiosError<ErrorBody>): ApiError {
  if (error.code === 'ERR_CANCELED') return new ApiError(0, 'canceled')

  const status = error.response?.status ?? 0
  const data = error.response?.data
  const body = typeof data === 'object' ? data : undefined
  // Our endpoints answer { error: "<the reason>" }. Spring's own error page (timestamp, path…) has
  // error: "Bad Request" and the reason in message (the Akfa endpoints answer so): take that.
  const springDefault = body?.timestamp !== undefined && body?.path !== undefined && !!body?.message
  const backendMessage =
    typeof data === 'string' ? data : springDefault ? body.message : (body?.error ?? body?.message)
  const message = backendMessage || i18n.t(status === 0 ? 'errors.network' : 'errors.unknown')

  const { token, logout } = useSession.getState()
  if (status === 401 && token) logout() // session expired → guard sends the user to /login
  if (status === 420) toast.warning(message) // backend warning, e.g. record is in use
  if (status === 0 || status >= 500) toast.error(message)

  const details = [
    data && typeof data === 'string' ? data : '',
    body?.error,
    body?.message,
    body?.code,
  ]
    .filter((v): v is string => typeof v === 'string' && v !== '')
    .join(' ')
  return new ApiError(status, message, body?.errors, details || message)
}

/**
 * A request made with `responseType: 'blob'` (Excel files) gets its error body as a Blob too.
 * Reads it back — JSON into an object, plain text (e.g. Akfa's 409) as text — so the backend's
 * message isn't lost.
 */
export async function readBlobError<T>(error: AxiosError<T>) {
  const data = error.response?.data
  if (!(data instanceof Blob)) return error
  const isJson = data.type.includes('json')
  if (!isJson && !data.type.startsWith('text/')) return error
  try {
    const text = await data.text()
    error.response!.data = (isJson ? JSON.parse(text) : text) as T
  } catch {
    // not readable after all — keep the generic message
  }
  return error
}
