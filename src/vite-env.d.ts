/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  /** Licence token of the webcc window constructor (the old REACT_APP_TOKEN). */
  readonly VITE_WEBCC_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
