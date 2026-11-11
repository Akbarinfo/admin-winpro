// Typed access to environment variables. Read env only through this module.
export const env = {
  API_URL: import.meta.env.VITE_API_URL as string,
  /** The window constructor's licence token; empty — the constructor isn't shown. */
  WEBCC_TOKEN: import.meta.env.VITE_WEBCC_TOKEN ?? '',
} as const
