import type { Connection } from './types'

/** «Product 1-Product 2», as the old list showed a connection. */
export const connectionName = (c: Connection) =>
  [c.product1Name, c.product2Name].filter(Boolean).join('-')

/** The name, or the articles when the record has no product names (e.g. GET by id). */
export const connectionLabel = (c: Connection) =>
  connectionName(c) || [c.article1, c.article2].filter(Boolean).join(' — ')
