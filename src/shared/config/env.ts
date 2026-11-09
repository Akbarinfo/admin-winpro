// Typed access to environment variables. Read env only through this module.
export const env = {
  API_URL: import.meta.env.VITE_API_URL as string,
} as const
