import type { RouteObject } from 'react-router'
import { SalesCategoryFormDialog } from './SalesCategoryFormDialog'
import { SalesCategoryListPage } from './SalesCategoryListPage'

// Same URLs as the old panel: /sales_category, /sales_category/add, /sales_category/update/:id.
export const salesCategoryRoutes: RouteObject[] = [
  {
    path: '/sales_category',
    element: <SalesCategoryListPage />,
    children: [
      { path: 'add', element: <SalesCategoryFormDialog /> },
      { path: 'update/:id', element: <SalesCategoryFormDialog /> },
    ],
  },
]
