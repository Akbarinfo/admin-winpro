import type { RouteObject } from 'react-router'

// Same URLs as the old panel. The form is big (and has providers), so it's a page, not a dialog.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formPage = () => import('./CountryFormPage').then((m) => ({ Component: m.CountryFormPage }))

export const countryRoutes: RouteObject[] = [
  {
    path: '/country',
    lazy: () => import('./CountryListPage').then((m) => ({ Component: m.CountryListPage })),
  },
  {
    path: '/country/add',
    lazy: formPage,
  },
  {
    path: '/country/update/:id',
    lazy: formPage,
  },
]
