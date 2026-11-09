import type { RouteObject } from 'react-router'
import { UnitFormDialog } from './UnitFormDialog'
import { UnitListPage } from './UnitListPage'

// Same URLs as the old panel: /units, /units/add, /units/update/:id.
export const unitRoutes: RouteObject[] = [
  {
    path: '/units',
    element: <UnitListPage />,
    children: [
      { path: 'add', element: <UnitFormDialog /> },
      { path: 'update/:id', element: <UnitFormDialog /> },
    ],
  },
]
