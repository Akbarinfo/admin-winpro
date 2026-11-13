/**
 * Where a scrolled list was left, per page and its query (pathname + search): coming back to the
 * same table shows the same rows. In memory only — for moving around within the session.
 */
const positions = new Map<string, number>()

export const scrollMemory = {
  get: (key: string) => positions.get(key) ?? 0,
  set: (key: string, top: number) => {
    if (top > 0) positions.set(key, top)
    else positions.delete(key)
  },
}
