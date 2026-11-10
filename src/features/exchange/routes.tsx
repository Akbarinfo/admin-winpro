import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /exchange, /exchange/add, /exchange/update/:id.
// The form opens as a dialog over the list, which stays visible underneath.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () =>
  import('./ExchangeFormDialog').then((m) => ({ Component: m.ExchangeFormDialog }))

export const exchangeRoutes: RouteObject[] = [
  {
    path: '/exchange',
    lazy: () => import('./ExchangeListPage').then((m) => ({ Component: m.ExchangeListPage })),
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
