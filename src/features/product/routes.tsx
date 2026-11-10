import type { RouteObject } from 'react-router'
import { groupPath, PRODUCT_GROUPS } from './groups'
import { ProductListPage } from './ProductListPage'

// Same URLs as the old panel: /product/profile, …/add, …/update/:id.
// The form is a page of its own (step 2 of the product module), so it isn't a child of the list.
export const productRoutes: RouteObject[] = PRODUCT_GROUPS.map((group) => ({
  path: groupPath(group),
  element: <ProductListPage key={group.key} group={group} />,
}))
