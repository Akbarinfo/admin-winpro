import { clsx, type ClassValue } from 'clsx'

/** Joins class names, skipping falsy values: cn('a', cond && 'b'). */
export const cn = (...values: ClassValue[]) => clsx(values)
