import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /currency, /currency/add, /currency/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () =>
  import('./CurrencyFormDialog').then((m) => ({ Component: m.CurrencyFormDialog }))

export const currencyRoutes: RouteObject[] = [
  {
    path: '/currency',
    lazy: () => import('./CurrencyListPage').then((m) => ({ Component: m.CurrencyListPage })),
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
