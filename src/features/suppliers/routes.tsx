import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /suppliers, /suppliers/add, /suppliers/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () =>
  import('./SupplierFormDialog').then((m) => ({ Component: m.SupplierFormDialog }))

export const supplierRoutes: RouteObject[] = [
  {
    path: '/suppliers',
    lazy: () => import('./SupplierListPage').then((m) => ({ Component: m.SupplierListPage })),
    children: [
      {
        path: 'add',
        lazy: formDialog,
      },
      {
        path: 'update/:id',
        lazy: formDialog,
      },
    ],
  },
]
