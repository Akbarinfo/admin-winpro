import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { normalizeError } from './errors'

vi.mock('sonner', () => ({ toast: { warning: vi.fn(), error: vi.fn() } }))

type Body = Parameters<typeof normalizeError>[0]['response'] extends infer R
  ? R extends { data: infer D }
    ? D
    : never
  : never

const axiosError = (status: number, data: Body) =>
  new AxiosError<Body>('fail', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  })

describe('normalizeError', () => {
  it('keeps every text of the body in details (codes may sit in message, not error)', () => {
    const e = normalizeError(
      axiosError(400, { error: 'Bad Request', message: 'error.bucket.not.found', code: 'B404' }),
    )
    expect(e.status).toBe(400)
    expect(e.message).toBe('Bad Request')
    expect(e.details).toContain('bucket.not.found')
    expect(e.details).toContain('B404')
  })

  it('takes a plain-text body as the message', () => {
    const e = normalizeError(axiosError(400, 'Неверный код'))
    expect(e.message).toBe('Неверный код')
    expect(e.details).toBe('Неверный код')
  })

  it('passes field errors through', () => {
    const e = normalizeError(axiosError(422, { error: 'x', errors: { name: 'taken' } }))
    expect(e.fields).toEqual({ name: 'taken' })
  })
})
