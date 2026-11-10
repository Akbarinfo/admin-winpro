import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ColorSwatch } from './ColorSwatch'

describe('ColorSwatch', () => {
  it('shows the colour code', () => {
    render(<ColorSwatch color="#a8743d" />)
    expect(screen.getByText('#a8743d')).toBeInTheDocument()
  })

  it('shows a dash without a colour', () => {
    render(<ColorSwatch color={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
