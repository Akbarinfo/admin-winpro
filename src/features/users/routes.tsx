import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /user, /user/add, /user/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () => import('./UserFormDialog').then((m) => ({ Component: m.UserFormDialog }))

export const userRoutes: RouteObject[] = [
  {
    path: '/user',
    lazy: () => import('./UserListPage').then((m) => ({ Component: m.UserListPage })),
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
