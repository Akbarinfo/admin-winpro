import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /connection, /connection/add, /connection/update/:id, /connection/type/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () =>
  import('./ConnectionFormDialog').then((m) => ({ Component: m.ConnectionFormDialog }))

export const connectionRoutes: RouteObject[] = [
  {
    path: '/connection',
    lazy: () => import('./ConnectionListPage').then((m) => ({ Component: m.ConnectionListPage })),
    children: [
      { path: 'add', lazy: formDialog },
      { path: 'update/:id', lazy: formDialog },
    ],
  },
  {
    path: '/connection/type/:id',
    lazy: () => import('./ConnectionTypePage').then((m) => ({ Component: m.ConnectionTypePage })),
  },
]
