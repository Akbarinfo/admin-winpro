import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TreeSelect } from './TreeSelect'

type Node = { id: number; name: string; children: Node[] }
const TREE: Node[] = [
  {
    id: 1,
    name: 'Akfa',
    children: [
      { id: 11, name: 'Akfa 60', children: [] },
      { id: 12, name: 'Akfa 70', children: [{ id: 121, name: 'Akfa 70 Termo', children: [] }] },
    ],
  },
  { id: 2, name: 'Engelberg', children: [] },
]

function Harness({
  initial = [],
  onChange,
}: {
  initial?: number[]
  onChange: (v: number[]) => void
}) {
  const [value, setValue] = useState<number[]>(initial)
  return (
    <TreeSelect
      options={TREE}
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange(v)
      }}
      getKey={(n) => n.id}
      getLabel={(n) => n.name}
      getChildren={(n) => n.children}
    />
  )
}

const item = (name: string) => screen.getByRole('treeitem', { name })

describe('TreeSelect', () => {
  it('shows roots first and opens a branch with its arrow', async () => {
    render(<Harness onChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getAllByRole('treeitem').map((n) => n.textContent)).toEqual(['Akfa', 'Engelberg'])
    expect(item('Akfa')).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(screen.getAllByTestId('tree-branch')[0])
    expect(item('Akfa')).toHaveAttribute('aria-expanded', 'true')
    expect(item('Akfa 60')).toHaveAttribute('aria-level', '2')
  })

  it('checking a parent checks all its leaves; the value holds leaves only', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(item('Akfa'))
    expect(onChange).toHaveBeenLastCalledWith([11, 121])
    expect(item('Akfa')).toHaveAttribute('aria-checked', 'true')
    // One chip for the whole branch.
    expect(screen.getByRole('button', { name: /Akfa$/ })).toBeInTheDocument()

    // Unchecking a child leaves the parent partly checked.
    await userEvent.click(screen.getAllByTestId('tree-branch')[0])
    await userEvent.click(item('Akfa 60'))
    expect(onChange).toHaveBeenLastCalledWith([121])
    expect(item('Akfa')).toHaveAttribute('aria-checked', 'mixed')
    expect(item('Akfa 70')).toHaveAttribute('aria-checked', 'true')

    // Checking the last missing leaf checks the parent again.
    await userEvent.click(item('Akfa 60'))
    expect(item('Akfa')).toHaveAttribute('aria-checked', 'true')

    // Unchecking the parent clears everything under it.
    await userEvent.click(item('Akfa'))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('a parent id in the value counts as all of its leaves', async () => {
    const onChange = vi.fn()
    render(<Harness initial={[12]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(item('Engelberg'))
    expect(onChange).toHaveBeenLastCalledWith([121, 2])
  })

  it('search shows matches with their parents', async () => {
    render(<Harness onChange={vi.fn()} />)
    await userEvent.type(screen.getByRole('combobox'), 'termo')
    expect(screen.getAllByRole('treeitem').map((n) => n.textContent)).toEqual([
      'Akfa',
      'Akfa 70',
      'Akfa 70 Termo',
    ])
  })

  it('opens the branches of chosen nodes and shows them as chips', async () => {
    const onChange = vi.fn()
    render(<Harness initial={[11]} onChange={onChange} />)
    expect(screen.getByText('Akfa 60')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('combobox'))
    expect(item('Akfa 60')).toHaveAttribute('aria-checked', 'true')
    expect(item('Akfa')).toHaveAttribute('aria-checked', 'mixed')

    await userEvent.click(screen.getByRole('button', { name: /Akfa 60/ }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('a branch with all leaves checked is one chip', () => {
    render(<Harness initial={[121]} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Akfa 70$/ })).toBeInTheDocument()
    expect(screen.queryByText('Akfa 70 Termo')).not.toBeInTheDocument()
  })

  it('works from the keyboard', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = screen.getByRole('combobox')
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowRight}{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenLastCalledWith([11])
    await userEvent.keyboard('{Backspace}')
    expect(onChange).toHaveBeenLastCalledWith([])
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}')
    expect(item('Akfa')).toHaveAttribute('aria-expanded', 'false')
  })
})
