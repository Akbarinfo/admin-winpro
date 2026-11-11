import type { ProfileSystemNode } from '@/shared/lookups/profileSystems'

export type Row = { node: ProfileSystemNode; level: number; hasChildren: boolean; open: boolean }

/** The nodes shown: roots, and the children of every open node, in order. */
export function visibleRows(
  nodes: ProfileSystemNode[],
  expanded: ReadonlySet<number>,
  level = 1,
): Row[] {
  return nodes.flatMap((node) => {
    const hasChildren = !!node.children?.length
    const open = hasChildren && expanded.has(node.id)
    const row = { node, level, hasChildren, open }
    return open ? [row, ...visibleRows(node.children!, expanded, level + 1)] : [row]
  })
}

/** Every node that has children — «expand all». */
export function branchIds(nodes: ProfileSystemNode[]): number[] {
  return nodes.flatMap((n) => (n.children?.length ? [n.id, ...branchIds(n.children)] : []))
}

/** Ids from the roots down to `id` (excluding it), to open the way to a chosen node. */
export function pathTo(nodes: ProfileSystemNode[], id: number): number[] | null {
  for (const n of nodes) {
    if (n.id === id) return []
    const below = n.children ? pathTo(n.children, id) : null
    if (below) return [n.id, ...below]
  }
  return null
}

/** Every node with its path, «Akfa / Termo 70», for picking one from a flat list. */
export function flattenWithPath(
  nodes: ProfileSystemNode[],
  prefix = '',
): { id: number; name: string }[] {
  return nodes.flatMap((n) => {
    const name = prefix ? `${prefix} / ${n.name}` : n.name
    return [{ id: n.id, name }, ...(n.children ? flattenWithPath(n.children, name) : [])]
  })
}

/**
 * The tree cut to the nodes whose name has `query` (any case) and the way down to them.
 * A matching node keeps all its children; an empty query keeps everything.
 */
export function filterTree(nodes: ProfileSystemNode[], query: string): ProfileSystemNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return nodes
  return nodes.flatMap((n) => {
    if (n.name.toLowerCase().includes(q)) return [n]
    const children = n.children ? filterTree(n.children, q) : []
    return children.length ? [{ ...n, children }] : []
  })
}

/** The node with this id, anywhere in the tree. */
export function findNode(nodes: ProfileSystemNode[], id: number): ProfileSystemNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    const below = n.children ? findNode(n.children, id) : undefined
    if (below) return below
  }
  return undefined
}
