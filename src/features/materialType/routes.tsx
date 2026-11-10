import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /material-type, /material-type/add, /material-type/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () =>
  import('./MaterialTypeFormDialog').then((m) => ({ Component: m.MaterialTypeFormDialog }))

export const materialTypeRoutes: RouteObject[] = [
  {
    path: '/material-type',
    lazy: () =>
      import('./MaterialTypeListPage').then((m) => ({ Component: m.MaterialTypeListPage })),
    children: [
      {
        path: 'add',
        lazy: formDialog,
      },
      {
        path: 'update/:id',
        lazy: formDialog,
      },
    ],
  },
]
