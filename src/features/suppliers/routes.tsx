import type { RouteObject } from 'react-router'
import { SupplierFormDialog } from './SupplierFormDialog'
import { SupplierListPage } from './SupplierListPage'

// Same URLs as the old panel: /suppliers, /suppliers/add, /suppliers/update/:id.
export const supplierRoutes: RouteObject[] = [
  {
    path: '/suppliers',
    element: <SupplierListPage />,
    children: [
      { path: 'add', element: <SupplierFormDialog /> },
      { path: 'update/:id', element: <SupplierFormDialog /> },
    ],
  },
]
