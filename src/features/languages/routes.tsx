import type { RouteObject } from 'react-router'
import { LanguageFormDialog } from './LanguageFormDialog'
import { LanguageListPage } from './LanguageListPage'

// Same URLs as the old panel: /languages, /languages/add, /languages/update/:code.
export const languageRoutes: RouteObject[] = [
  {
    path: '/languages',
    element: <LanguageListPage />,
    children: [
      { path: 'add', element: <LanguageFormDialog /> },
      { path: 'update/:code', element: <LanguageFormDialog /> },
    ],
  },
]
