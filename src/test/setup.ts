import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@/shared/i18n'
import { blockNetwork, takeNetworkAttempts } from './network'

// No test may touch the real backend (its database is real): requests are refused,
// and a test that tried one fails here even if it swallowed the error.
blockNetwork()

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  const attempts = takeNetworkAttempts()
  if (attempts.length)
    throw new Error(`Test real tarmoqqa so'rov yubormoqchi bo'ldi:\n${attempts.join('\n')}`)
})
