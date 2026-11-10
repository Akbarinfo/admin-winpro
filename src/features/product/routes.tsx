import type { RouteObject } from 'react-router'
import { groupPath, PRODUCT_GROUPS, PROFILE_GROUP } from './groups'

// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const profileForm = () => import('./ProfileFormPage')

// Same URLs as the old panel: /product/profile, …/add, …/update/:id.
// The form is long (sizes, drawing, translations), so it's a page of its own, not a dialog.
export const productRoutes: RouteObject[] = [
  ...PRODUCT_GROUPS.map((group) => ({
    path: groupPath(group),
    lazy: () =>
      import('./ProductListPage').then((m) => ({
        element: <m.ProductListPage key={group.key} group={group} />,
      })),
  })),
  {
    path: `${groupPath(PROFILE_GROUP)}/add`,
    lazy: () => profileForm().then((m) => ({ Component: m.ProfileFormPage })),
  },
  {
    path: `${groupPath(PROFILE_GROUP)}/update/:id`,
    lazy: () => profileForm().then((m) => ({ Component: m.ProfileFormByIdPage })),
  },
]
