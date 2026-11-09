import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ImageUpload } from './ImageUpload'

function Harness({ onChange, crop }: { onChange: (f: File | null) => void; crop?: boolean }) {
  const [value, setValue] = useState<File | null>(null)
  return (
    <ImageUpload
      id="logo"
      value={value}
      crop={crop}
      onChange={(f) => {
        setValue(f)
        onChange(f)
      }}
    />
  )
}

const png = () => new File(['png'], 'logo.png', { type: 'image/png' })
const input = () => document.getElementById('logo') as HTMLInputElement

describe('ImageUpload', () => {
  it('offers cropping and can keep the original', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.upload(input(), png())

    const dialog = await screen.findByRole('dialog', { name: 'Обрезать изображение' })
    expect(within(dialog).getByRole('group', { name: 'Пропорции' })).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Загрузить оригинал' }))

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'logo.png' }))
    expect(screen.queryByRole('dialog', { name: 'Обрезать изображение' })).not.toBeInTheDocument()
  })

  it('cancelling the crop keeps the previous image', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.upload(input(), png())
    const dialog = await screen.findByRole('dialog', { name: 'Обрезать изображение' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('skips cropping when turned off', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} crop={false} />)
    await userEvent.upload(input(), png())
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'logo.png' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('rejects files that are not images', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.upload(input(), new File(['x'], 'doc.pdf', { type: 'application/pdf' }), {
      applyAccept: false,
    })
    expect(screen.getByText('Это не изображение. Выберите PNG, JPG или GIF.')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})
