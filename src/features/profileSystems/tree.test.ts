import { describe, expect, it } from 'vitest'
import { branchIds, filterTree, findNode, flattenWithPath, pathTo, visibleRows } from './tree'

const TREE = [
  {
    id: 1,
    name: 'Akfa',
    children: [
      { id: 11, name: 'Termo 70', children: [{ id: 111, name: 'Termo 70 Lux' }] },
      { id: 12, name: 'Termo 60' },
    ],
  },
  { id: 2, name: 'Enwin' },
]

describe('profile-system tree helpers', () => {
  it('shows the children of open nodes only', () => {
    expect(visibleRows(TREE, new Set()).map((r) => r.node.id)).toEqual([1, 2])
    expect(visibleRows(TREE, new Set([1])).map((r) => [r.node.id, r.level])).toEqual([
      [1, 1],
      [11, 2],
      [12, 2],
      [2, 1],
    ])
  })

  it('finds branches, the way to a node and the paths', () => {
    expect(branchIds(TREE)).toEqual([1, 11])
    expect(pathTo(TREE, 111)).toEqual([1, 11])
    expect(pathTo(TREE, 2)).toEqual([])
    expect(findNode(TREE, 111)?.name).toBe('Termo 70 Lux')
    expect(findNode(TREE, 999)).toBeUndefined()
    expect(pathTo(TREE, 999)).toBeNull()
    expect(flattenWithPath(TREE).map((x) => x.name)).toEqual([
      'Akfa',
      'Akfa / Termo 70',
      'Akfa / Termo 70 / Termo 70 Lux',
      'Akfa / Termo 60',
      'Enwin',
    ])
  })

  it('cuts the tree to the matches and the way to them', () => {
    expect(filterTree(TREE, '  ')).toBe(TREE)
    // «lux» deep down: its parents stay, their other children go
    expect(filterTree(TREE, 'LUX')).toEqual([
      {
        id: 1,
        name: 'Akfa',
        children: [{ id: 11, name: 'Termo 70', children: [{ id: 111, name: 'Termo 70 Lux' }] }],
      },
    ])
    // a matching branch keeps all its children
    expect(filterTree(TREE, 'akfa')).toEqual([TREE[0]])
    expect(filterTree(TREE, 'нет такого')).toEqual([])
  })
})
