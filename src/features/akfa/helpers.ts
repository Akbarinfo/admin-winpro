import { toast } from 'sonner'
import { isClientError } from '@/shared/api/errors'
import { formatNumber } from '@/shared/lib/format'

/** «1 250 000 сум», or «—» without a price (the old formatPrice). */
export const formatPrice = (price?: number | null, currency?: string | null) =>
  price === null || price === undefined ? '—' : `${formatNumber(price)} ${currency ?? ''}`.trim()

/**
 * Shows a failed action's reason. The API client toasts 5xx, network errors and 420 (a backend
 * warning) itself: only the other 4xx are shown here.
 */
export const toastClientError = (error: unknown, fallback: string) => {
  if (isClientError(error) && error.status !== 420) toast.error(error.message || fallback)
}
