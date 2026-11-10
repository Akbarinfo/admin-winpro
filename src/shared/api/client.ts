import axios from 'axios'
import { env } from '@/shared/config/env'
import { usePreferences } from '@/shared/store/preferences'
import { useSession } from '@/shared/store/session'
import { normalizeError, readBlobError } from './errors'

export const api = axios.create({ baseURL: env.API_URL })

// Token and language are added to every request here — never by hand in features.
api.interceptors.request.use((config) => {
  const { token } = useSession.getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['Accept-Language'] = usePreferences.getState().lang
  return config
})

// Every error leaves the client as an ApiError.
api.interceptors.response.use(
  (response) => response,
  async (error) => Promise.reject(normalizeError(await readBlobError(error))),
)
