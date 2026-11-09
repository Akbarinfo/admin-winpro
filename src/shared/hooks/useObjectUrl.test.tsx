import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useObjectUrl } from './useObjectUrl'

let counter = 0
const revoked = new Set<string>()

beforeEach(() => {
  counter = 0
  revoked.clear()
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test/${++counter}`)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => void revoked.add(url))
})
afterEach(() => vi.restoreAllMocks())

function Probe({ file }: { file: Blob | null }) {
  const url = useObjectUrl(file)
  return <span data-testid="url">{url ?? 'none'}</span>
}

const shown = () => screen.getByTestId('url').textContent!

describe('useObjectUrl', () => {
  // Regression: with useMemo + cleanup, StrictMode revoked the URL and kept returning it,
  // so the crop dialog showed an empty canvas.
  it('returns a live (not revoked) URL under StrictMode', () => {
    render(
      <StrictMode>
        <Probe file={new Blob(['x'])} />
      </StrictMode>,
    )
    expect(shown()).toMatch(/^blob:test\//)
    expect(revoked.has(shown())).toBe(false)
  })

  it('frees the old URL when the file changes and returns none without a file', () => {
    const { rerender } = render(<Probe file={new Blob(['a'])} />)
    const first = shown()
    rerender(<Probe file={new Blob(['b'])} />)
    expect(revoked.has(first)).toBe(true)
    expect(shown()).not.toBe(first)
    rerender(<Probe file={null} />)
    expect(shown()).toBe('none')
  })
})
