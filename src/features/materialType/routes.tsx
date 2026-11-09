import type { RouteObject } from 'react-router'
import { MaterialTypeFormDialog } from './MaterialTypeFormDialog'
import { MaterialTypeListPage } from './MaterialTypeListPage'

// Same URLs as the old panel: /material-type, /material-type/add, /material-type/update/:id.
export const materialTypeRoutes: RouteObject[] = [
  {
    path: '/material-type',
    element: <MaterialTypeListPage />,
    children: [
      { path: 'add', element: <MaterialTypeFormDialog /> },
      { path: 'update/:id', element: <MaterialTypeFormDialog /> },
    ],
  },
]
