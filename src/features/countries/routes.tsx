import type { RouteObject } from 'react-router'
import { CountryFormPage } from './CountryFormPage'
import { CountryListPage } from './CountryListPage'

// Same URLs as the old panel. The form is big (and has providers), so it's a page, not a dialog.
export const countryRoutes: RouteObject[] = [
  { path: '/country', element: <CountryListPage /> },
  { path: '/country/add', element: <CountryFormPage /> },
  { path: '/country/update/:id', element: <CountryFormPage /> },
]
