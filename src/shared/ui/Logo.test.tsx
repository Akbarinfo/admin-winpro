import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Logo } from './Logo'

describe('Logo', () => {
  it('is an image named after the brand, with the given size', () => {
    render(<Logo className="h-11" />)
    const logo = screen.getByRole('img', { name: 'WinPro Admin' })
    expect(logo).toHaveClass('h-11')
  })

  it('takes another name', () => {
    render(<Logo label="WinPro" />)
    expect(screen.getByRole('img', { name: 'WinPro' })).toBeInTheDocument()
  })

  it('gives each logo on a page its own clip path', () => {
    const { container } = render(
      <>
        <Logo />
        <Logo />
      </>,
    )
    const ids = [...container.querySelectorAll('clipPath')].map((c) => c.id)
    expect(new Set(ids).size).toBe(2)
  })
})
