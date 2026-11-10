import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /languages, /languages/add, /languages/update/:code.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () =>
  import('./LanguageFormDialog').then((m) => ({ Component: m.LanguageFormDialog }))

export const languageRoutes: RouteObject[] = [
  {
    path: '/languages',
    lazy: () => import('./LanguageListPage').then((m) => ({ Component: m.LanguageListPage })),
    children: [
      {
        path: 'add',
        lazy: formDialog,
      },
      {
        path: 'update/:code',
        lazy: formDialog,
      },
    ],
  },
]
