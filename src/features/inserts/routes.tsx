import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /inserts and /inserts/layout/page/:id; the product's form opens over
// the list on add and update/:id. Pages load on first visit; translations come from index.ts.
const formDialog = () =>
  import('./InsertFormDialog').then((m) => ({ Component: m.InsertFormDialog }))

export const insertRoutes: RouteObject[] = [
  {
    path: '/inserts',
    lazy: () => import('./InsertsListPage').then((m) => ({ Component: m.InsertsListPage })),
    children: [
      { path: 'add', lazy: formDialog },
      { path: 'update/:id', lazy: formDialog },
    ],
  },
  {
    path: '/inserts/layout/page/:id',
    lazy: () => import('./InsertPage').then((m) => ({ Component: m.InsertPage })),
  },
]
