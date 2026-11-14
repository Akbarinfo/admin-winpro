import { i18n } from '@/shared/i18n'

const LOCALES: Record<string, string> = { ru: 'ru-RU', uz: 'uz-Latn-UZ', en: 'en-US' }
const locale = () => LOCALES[i18n.language] ?? 'ru-RU'

/** 12648.5 → «12 648,50» (ru). `digits` fixes the number of decimals. */
export function formatNumber(value: number | null | undefined, digits?: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  return new Intl.NumberFormat(locale(), {
    minimumFractionDigits: digits ?? 0,
    maximumFractionDigits: digits ?? 6,
  }).format(value)
}

/** «2026-10-19» or an ISO timestamp → «19.10.2026». Invalid input is returned unchanged. */
export function formatDate(value: string | null | undefined) {
  if (!value) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value
}

/** «2026-10-19T14:05:33» → «19.10.2026 14:05» (the backend's local time, as written). Date only if there's no time. */
export function formatDateTime(value: string | null | undefined) {
  if (!value) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value)
  return match ? `${match[3]}.${match[2]}.${match[1]} ${match[4]}:${match[5]}` : formatDate(value)
}

/** Today as «YYYY-MM-DD» in local time — the value format of <input type="date">. */
export function todayIso() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/**
 * A moment in the past, said the way people say it: «5 минут назад», «вчера».
 * Under a minute it's our own text («только что», «hozir»): browsers lack Uzbek for it and said «now».
 */
export function formatRelative(at: number, now = Date.now()) {
  const seconds = Math.round((now - at) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' })
  for (const [unit, size] of UNITS)
    if (seconds >= size) return rtf.format(-Math.floor(seconds / size), unit)
  return i18n.t('common.just_now')
}
