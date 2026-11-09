import type { RouteObject } from 'react-router'
import { WorkshopServiceFormDialog } from './WorkshopServiceFormDialog'
import { WorkshopServiceListPage } from './WorkshopServiceListPage'

// Same URLs as the old panel: /workshop-service, /workshop-service/add, /workshop-service/update/:id.
export const workshopServiceRoutes: RouteObject[] = [
  {
    path: '/workshop-service',
    element: <WorkshopServiceListPage />,
    children: [
      { path: 'add', element: <WorkshopServiceFormDialog /> },
      { path: 'update/:id', element: <WorkshopServiceFormDialog /> },
    ],
  },
]
