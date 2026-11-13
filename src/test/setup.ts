import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@/shared/i18n'
import { useLastView, useTablePrefs } from '@/shared/store/tablePrefs'
import { blockNetwork, takeNetworkAttempts } from './network'

// No test may touch the real backend (its database is real): requests are refused,
// and a test that tried one fails here even if it swallowed the error.
blockNetwork()

// findBy/waitFor wait up to 3 s, not 1: with ~450 tests running in parallel a slow machine
// sometimes needed a little over a second for a debounced search plus a re-render.
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  localStorage.removeItem('winpro.tables')
  // remembered page sizes and last views mustn't leak from one test into the next
  useTablePrefs.setState({ sizes: {} })
  useLastView.setState({ search: {} })
  const attempts = takeNetworkAttempts()
  if (attempts.length)
    throw new Error(`Test real tarmoqqa so'rov yubormoqchi bo'ldi:\n${attempts.join('\n')}`)
})
