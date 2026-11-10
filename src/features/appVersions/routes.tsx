import type { RouteObject } from 'react-router'
import { AppVersionFormDialog } from './AppVersionFormDialog'
import { AppVersionListPage } from './AppVersionListPage'

// Same URLs as the old panel: /app-versions, /app-versions/add, /app-versions/update/:platform.
export const appVersionRoutes: RouteObject[] = [
  {
    path: '/app-versions',
    element: <AppVersionListPage />,
    children: [
      { path: 'add', element: <AppVersionFormDialog /> },
      { path: 'update/:platform', element: <AppVersionFormDialog /> },
    ],
  },
]
