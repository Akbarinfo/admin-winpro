import { afterEach, describe, expect, it } from 'vitest'
import { takeNetworkAttempts } from './network'

// These tests make requests on purpose; clear them so setup.ts doesn't fail the test.
afterEach(() => {
  takeNetworkAttempts()
})

describe('network in tests', () => {
  it('refuses fetch', async () => {
    await expect(fetch('https://api.example.test/v1/unit/list')).rejects.toThrow(
      "Testda tarmoqqa so'rov",
    )
    expect(takeNetworkAttempts()).toEqual(['fetch https://api.example.test/v1/unit/list'])
  })

  it('refuses XMLHttpRequest (what axios uses)', () => {
    const xhr = new XMLHttpRequest()
    expect(() => xhr.open('delete', 'https://api.example.test/v1/product/41')).toThrow(
      "Testda tarmoqqa so'rov",
    )
    expect(takeNetworkAttempts()).toEqual(['DELETE https://api.example.test/v1/product/41'])
  })
})
