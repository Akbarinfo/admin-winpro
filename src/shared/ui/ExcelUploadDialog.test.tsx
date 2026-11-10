import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/errors'
import { renderWithProviders } from '@/test/render'
import { ExcelUploadDialog } from './ExcelUploadDialog'

const xlsx = new File(['x'], 'profiles.xlsx')

type Upload = (file: File, onProgress: (percent: number) => void) => Promise<unknown>

const setup = (onUpload = vi.fn<Upload>(async () => {})) => {
  const onClose = vi.fn()
  const onTemplate = vi.fn(async () => {})
  renderWithProviders(
    <ExcelUploadDialog
      title="Импорт товаров"
      onClose={onClose}
      onTemplate={onTemplate}
      onUpload={onUpload}
    />,
  )
  return { onClose, onTemplate, onUpload }
}

describe('ExcelUploadDialog', () => {
  it('uploads the chosen file and closes', async () => {
    const { onUpload, onClose } = setup()
    await userEvent.upload(screen.getByLabelText('Файл Excel'), xlsx)
    expect(screen.getByText('profiles.xlsx')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Загрузить' }))
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(xlsx, expect.any(Function)))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('asks for a file and rejects other types', async () => {
    const { onUpload } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Загрузить' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Выберите файл Excel')
    await userEvent.upload(screen.getByLabelText('Файл Excel'), new File(['x'], 'photo.png'), {
      applyAccept: false,
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Это не файл Excel')
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('shows progress and stays open when the upload fails', async () => {
    let fail: (e: Error) => void = () => {}
    const onUpload = vi.fn<Upload>((_, onProgress) => {
      onProgress(40)
      return new Promise((_, reject) => (fail = reject))
    })
    const { onClose } = setup(onUpload)
    await userEvent.upload(screen.getByLabelText('Файл Excel'), xlsx)
    await userEvent.click(screen.getByRole('button', { name: 'Загрузить' }))
    expect(await screen.findByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
    fail(new Error('500'))
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('downloads the template', async () => {
    const { onTemplate } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Скачать шаблон' }))
    expect(onTemplate).toHaveBeenCalledOnce()
  })

  it('shows a 4xx answer in the dialog and stays open', async () => {
    const { onClose } = setup(
      vi.fn<Upload>(async () => Promise.reject(new ApiError(400, 'Неверный формат'))),
    )
    await userEvent.upload(screen.getByLabelText('Файл Excel'), xlsx)
    await userEvent.click(screen.getByRole('button', { name: 'Загрузить' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный формат')
    expect(screen.getByLabelText('Файл Excel')).toHaveAttribute('aria-invalid', 'true')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not submit a form it is opened in', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    renderWithProviders(
      <form onSubmit={onSubmit}>
        <ExcelUploadDialog
          title="Импорт"
          onClose={() => {}}
          onTemplate={async () => {}}
          onUpload={async () => {}}
        />
      </form>,
    )
    await userEvent.upload(screen.getByLabelText('Файл Excel'), xlsx)
    await userEvent.click(screen.getByRole('button', { name: 'Загрузить' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
