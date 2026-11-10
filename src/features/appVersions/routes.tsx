import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /app-versions, /app-versions/add, /app-versions/update/:platform.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () =>
  import('./AppVersionFormDialog').then((m) => ({ Component: m.AppVersionFormDialog }))

export const appVersionRoutes: RouteObject[] = [
  {
    path: '/app-versions',
    lazy: () => import('./AppVersionListPage').then((m) => ({ Component: m.AppVersionListPage })),
    children: [
      {
        path: 'add',
        lazy: formDialog,
      },
      {
        path: 'update/:platform',
        lazy: formDialog,
      },
    ],
  },
]
