import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /tariff-feature, /tariff-feature/add, /tariff-feature/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
export const tariffFeatureRoutes: RouteObject[] = [
  {
    path: '/tariff-feature',
    lazy: () =>
      import('./TariffFeatureListPage').then((m) => ({ Component: m.TariffFeatureListPage })),
    children: [
      {
        path: 'add',
        lazy: () =>
          import('./TariffFeatureFormDialog').then((m) => ({
            Component: m.TariffFeatureFormDialog,
          })),
      },
      {
        path: 'update/:id',
        lazy: () =>
          import('./TariffFeatureFormDialog').then((m) => ({
            Component: m.TariffFeatureFormDialog,
          })),
      },
    ],
  },
]
