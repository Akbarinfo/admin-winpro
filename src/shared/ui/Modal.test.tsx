import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('closes on Escape (the dialog’s own cancel event)', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Окно">
        <p>body</p>
      </Modal>,
    )
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stays open when a file picker inside is closed without choosing a file', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Окно">
        <input type="file" aria-label="logo" />
      </Modal>,
    )
    // browsers fire a bubbling «cancel» at the file input when its picker is dismissed
    fireEvent(
      screen.getByLabelText('logo'),
      new Event('cancel', { bubbles: true, cancelable: true }),
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('stays open on a click on the backdrop, unless asked to close then', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <Modal open onClose={onClose} title="Окно">
        <p>body</p>
      </Modal>,
    )
    // a click on the <dialog> itself is a click on its backdrop
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    // a click inside isn't one either way
    rerender(
      <Modal open onClose={onClose} title="Окно" closeOnBackdrop>
        <p>body</p>
      </Modal>,
    )
    fireEvent.click(screen.getByText('body'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
