import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /filling, /filling/add, /filling/update/:id, /filling/specification/:id.
// The group's form (a page before) opens as a dialog over the list. Pages load on first visit.
const formDialog = () =>
  import('./FillingFormDialog').then((m) => ({ Component: m.FillingFormDialog }))

export const fillingRoutes: RouteObject[] = [
  {
    path: '/filling',
    lazy: () => import('./FillingListPage').then((m) => ({ Component: m.FillingListPage })),
    children: [
      { path: 'add', lazy: formDialog },
      { path: 'update/:id', lazy: formDialog },
    ],
  },
  {
    path: '/filling/specification/:id',
    lazy: () =>
      import('./FillingSpecificationPage').then((m) => ({ Component: m.FillingSpecificationPage })),
  },
]
