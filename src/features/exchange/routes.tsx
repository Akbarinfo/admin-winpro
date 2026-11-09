import type { RouteObject } from 'react-router'
import { ExchangeFormDialog } from './ExchangeFormDialog'
import { ExchangeListPage } from './ExchangeListPage'

// Same URLs as the old panel: /exchange, /exchange/add, /exchange/update/:id.
// The form opens as a dialog over the list, which stays visible underneath.
export const exchangeRoutes: RouteObject[] = [
  {
    path: '/exchange',
    element: <ExchangeListPage />,
    children: [
      { path: 'add', element: <ExchangeFormDialog /> },
      { path: 'update/:id', element: <ExchangeFormDialog /> },
    ],
  },
]
