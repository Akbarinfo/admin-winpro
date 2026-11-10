import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /sales_category, /sales_category/add, /sales_category/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
export const salesCategoryRoutes: RouteObject[] = [
  {
    path: '/sales_category',
    lazy: () =>
      import('./SalesCategoryListPage').then((m) => ({ Component: m.SalesCategoryListPage })),
    children: [
      {
        path: 'add',
        lazy: () =>
          import('./SalesCategoryFormDialog').then((m) => ({
            Component: m.SalesCategoryFormDialog,
          })),
      },
      {
        path: 'update/:id',
        lazy: () =>
          import('./SalesCategoryFormDialog').then((m) => ({
            Component: m.SalesCategoryFormDialog,
          })),
      },
    ],
  },
]
