import type { RouteObject } from 'react-router'
import { groupPath, PRODUCT_GROUPS, type ProductGroup } from './groups'

// Pages load on first visit (their own chunks); translations are registered up front by index.ts.
// The form page is one for every group; the group's own fields come from its forms/<group>.tsx.
const formPage = (group: ProductGroup) => () =>
  Promise.all([import('./ProductFormPage'), group.loadForm()]).then(([m, spec]) => ({
    element: <m.ProductFormPage group={group} spec={spec} />,
  }))

// Same URLs as the old panel: /product/<group>, …/add, …/update/:id.
// The form is long (sizes, drawing, translations), so it's a page of its own, not a dialog.
export const productRoutes: RouteObject[] = PRODUCT_GROUPS.flatMap((group) => [
  {
    path: groupPath(group),
    lazy: () =>
      import('./ProductListPage').then((m) => ({
        element: <m.ProductListPage key={group.key} group={group} />,
      })),
  },
  { path: `${groupPath(group)}/add`, lazy: formPage(group) },
  { path: `${groupPath(group)}/update/:id`, lazy: formPage(group) },
])
