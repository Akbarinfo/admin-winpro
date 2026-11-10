import type { RouteObject } from 'react-router'
import { groupPath, PRODUCT_GROUPS, PROFILE_GROUP } from './groups'
import { ProductListPage } from './ProductListPage'
import { ProfileFormByIdPage, ProfileFormPage } from './ProfileFormPage'

// Same URLs as the old panel: /product/profile, …/add, …/update/:id.
// The form is long (sizes, drawing, translations), so it's a page of its own, not a dialog.
export const productRoutes: RouteObject[] = [
  ...PRODUCT_GROUPS.map((group) => ({
    path: groupPath(group),
    element: <ProductListPage key={group.key} group={group} />,
  })),
  { path: `${groupPath(PROFILE_GROUP)}/add`, element: <ProfileFormPage /> },
  { path: `${groupPath(PROFILE_GROUP)}/update/:id`, element: <ProfileFormByIdPage /> },
]
