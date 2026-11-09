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

/** Today as «YYYY-MM-DD» in local time — the value format of <input type="date">. */
export function todayIso() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
