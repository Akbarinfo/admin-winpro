import { describe, expect, it, vi } from 'vitest'
import { base64ToBlob, saveBlob, XLSX_TYPE } from './download'

describe('base64ToBlob', () => {
  it('decodes the bytes', async () => {
    const blob = base64ToBlob(btoa('PK\u0003\u0004'), XLSX_TYPE)
    expect(blob.type).toBe(XLSX_TYPE)
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([80, 75, 3, 4]))
  })
})

describe('saveBlob', () => {
  it('clicks a temporary download link with the file name', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('profiles.xlsx')
      expect(this.href).toBe('blob:x')
    })
    vi.useFakeTimers()
    saveBlob(new Blob(['x']), 'profiles.xlsx')
    expect(click).toHaveBeenCalledOnce()
    vi.runAllTimers()
    vi.useRealTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
    click.mockRestore()
  })
})
