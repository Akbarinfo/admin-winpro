/** One row per platform, from /v1/app-version/list. */
export type AppVersion = {
  /** «ANDROID», «IOS»… — also the record's key */
  platform: string
  latestVersion?: string | null
  minVersion?: string | null
  forceUpdate?: boolean | null
  storeUrl?: string | null
  releaseNotes?: string | null
  updatedAt?: string | null
}
