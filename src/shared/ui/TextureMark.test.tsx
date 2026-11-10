import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextureMark } from './TextureMark'

describe('TextureMark', () => {
  it('shows the picture when there is one', () => {
    const { container } = render(<TextureMark src="/v1/file/texture/3" color="#a8743d" />)
    expect(container.querySelector('img')).toHaveAttribute('src', '/v1/file/texture/3')
  })

  it('falls back to the colour when the picture fails', () => {
    const { container } = render(<TextureMark src="/broken" color="#a8743d" />)
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('span')).toHaveStyle({ backgroundColor: '#a8743d' })
  })
})
