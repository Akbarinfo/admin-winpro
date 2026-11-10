import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /units, /units/add, /units/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () => import('./UnitFormDialog').then((m) => ({ Component: m.UnitFormDialog }))

export const unitRoutes: RouteObject[] = [
  {
    path: '/units',
    lazy: () => import('./UnitListPage').then((m) => ({ Component: m.UnitListPage })),
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
