import type { RouteObject } from 'react-router'
import { CurrencyFormDialog } from './CurrencyFormDialog'
import { CurrencyListPage } from './CurrencyListPage'

// Same URLs as the old panel: /currency, /currency/add, /currency/update/:id.
export const currencyRoutes: RouteObject[] = [
  {
    path: '/currency',
    element: <CurrencyListPage />,
    children: [
      { path: 'add', element: <CurrencyFormDialog /> },
      { path: 'update/:id', element: <CurrencyFormDialog /> },
    ],
  },
]
