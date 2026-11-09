import type { RouteObject } from 'react-router'
import { SeriesFormDialog } from './SeriesFormDialog'
import { SeriesListPage } from './SeriesListPage'

// Same URLs as the old panel: /series, /series/add, /series/update/:id.
export const seriesRoutes: RouteObject[] = [
  {
    path: '/series',
    element: <SeriesListPage />,
    children: [
      { path: 'add', element: <SeriesFormDialog /> },
      { path: 'update/:id', element: <SeriesFormDialog /> },
    ],
  },
]
