import type { RouteObject } from 'react-router'

// Same URLs as the old panel. The form is small, so it's a dialog over the list (add, update/:key).
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
export const translationRoutes: RouteObject[] = [
  {
    path: '/translations',
    lazy: () => import('./TranslationListPage').then((m) => ({ Component: m.TranslationListPage })),
    children: [
      {
        path: 'add',
        lazy: () =>
          import('./TranslationFormDialog').then((m) => ({ Component: m.TranslationFormDialog })),
      },
      {
        path: 'update/:key',
        lazy: () =>
          import('./TranslationFormDialog').then((m) => ({ Component: m.TranslationFormDialog })),
      },
    ],
  },
]
