import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { normalizeError, readBlobError } from './errors'

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

describe('normalizeError — Spring error pages', () => {
  it('takes the reason from message, not the «Bad Request» in error', () => {
    const e = normalizeError(
      axiosError(400, {
        timestamp: '2026-11-13T10:00:00',
        path: '/v1/akfa/products/1/map',
        error: 'Bad Request',
        message: 'Позиция уже привязана',
      } as Body),
    )
    expect(e.message).toBe('Позиция уже привязана')
  })
})

describe('readBlobError', () => {
  it('reads the JSON body of a blob request back, so its message shows', async () => {
    const blob = new Blob([JSON.stringify({ error: 'Неверный формат файла' })], {
      type: 'application/json',
    })
    const error = await readBlobError(axiosError(400, blob as unknown as Body))
    expect(normalizeError(error as never).message).toBe('Неверный формат файла')
  })

  it('reads a plain-text blob body as the message', async () => {
    const blob = new Blob(['Нет несопоставленных товаров'], { type: 'text/plain' })
    const error = await readBlobError(axiosError(409, blob as unknown as Body))
    expect(normalizeError(error as never).message).toBe('Нет несопоставленных товаров')
  })

  it('leaves other bodies alone', async () => {
    const error = axiosError(400, { error: 'x' })
    expect(await readBlobError(error)).toBe(error)
  })
})
