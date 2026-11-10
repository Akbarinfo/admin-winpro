import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /series, /series/add, /series/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () =>
  import('./SeriesFormDialog').then((m) => ({ Component: m.SeriesFormDialog }))

export const seriesRoutes: RouteObject[] = [
  {
    path: '/series',
    lazy: () => import('./SeriesListPage').then((m) => ({ Component: m.SeriesListPage })),
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
