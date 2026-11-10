import { api } from '@/shared/api/client'
import type { AppVersionValues } from './schema'
import type { AppVersion } from './types'

export const appVersionKeys = { all: ['app-version'] as const }

// Endpoints and bodies match the old panel (layout/appVersion, services/appVersionService.js).
export const appVersionApi = {
  list: (signal?: AbortSignal) =>
    api.get<AppVersion[]>('/v1/app-version/list', { signal }).then((r) => r.data),

  /** There is no get-by-id endpoint: the record is picked from the list by platform. */
  get: async (platform: string, signal?: AbortSignal) => {
    const found = (await appVersionApi.list(signal)).find((v) => v.platform === platform)
    if (!found) throw new Error(`App version «${platform}» not found`)
    return found
  },

  platforms: (signal?: AbortSignal) =>
    api.get<string[]>('/v1/app-version/platforms', { signal }).then((r) => r.data),

  /** Upsert keyed by platform: add and edit are the same POST. Empty optional fields go as null. */
  save: (values: AppVersionValues) =>
    api.post('/v1/app-version/add', {
      platform: values.platform,
      latestVersion: values.latestVersion,
      minVersion: values.minVersion || null,
      forceUpdate: values.forceUpdate,
      storeUrl: values.storeUrl || null,
      releaseNotes: values.releaseNotes || null,
    }),
}
