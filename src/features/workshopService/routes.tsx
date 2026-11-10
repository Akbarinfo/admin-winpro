import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /workshop-service, /workshop-service/add, /workshop-service/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
export const workshopServiceRoutes: RouteObject[] = [
  {
    path: '/workshop-service',
    lazy: () =>
      import('./WorkshopServiceListPage').then((m) => ({ Component: m.WorkshopServiceListPage })),
    children: [
      {
        path: 'add',
        lazy: () =>
          import('./WorkshopServiceFormDialog').then((m) => ({
            Component: m.WorkshopServiceFormDialog,
          })),
      },
      {
        path: 'update/:id',
        lazy: () =>
          import('./WorkshopServiceFormDialog').then((m) => ({
            Component: m.WorkshopServiceFormDialog,
          })),
      },
    ],
  },
]
