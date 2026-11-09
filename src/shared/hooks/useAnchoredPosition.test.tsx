import { act, render, screen } from '@testing-library/react'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useAnchoredPosition } from './useAnchoredPosition'

function Probe() {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const style = useAnchoredPosition(ref, open)
  return (
    <div ref={ref}>
      <button onClick={() => setOpen(true)}>open</button>
      {open && <ul data-testid="list" style={style} />}
    </div>
  )
}

const rect = (top: number, bottom: number) =>
  ({
    top,
    bottom,
    left: 40,
    right: 340,
    width: 300,
    height: bottom - top,
    x: 40,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect

describe('useAnchoredPosition', () => {
  it('is fixed from the very first render, so it never pushes the layout', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(100, 136))
    render(<Probe />)
    act(() => screen.getByRole('button').click())
    const list = screen.getByTestId('list')
    expect(list.style.position).toBe('fixed')
    expect(list.style.top).toBe('140px') // bottom + 4px gap
    expect(list.style.width).toBe('300px')
    vi.restoreAllMocks()
  })

  it('opens upwards when there is more room above', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      rect(window.innerHeight - 60, window.innerHeight - 24),
    )
    render(<Probe />)
    act(() => screen.getByRole('button').click())
    const list = screen.getByTestId('list')
    expect(list.style.bottom).toBe('64px') // innerHeight - top + gap
    expect(list.style.top).toBe('')
    vi.restoreAllMocks()
  })
})
