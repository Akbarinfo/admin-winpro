import type { RouteObject } from 'react-router'

// Same URLs as the old panel: /furniture, /furniture/add, /furniture/update/:id,
// /furniture/main/specification/:id. (The old /furniture/depend/specification/:rowId page
// couldn't be opened — its button did nothing — so it isn't ported.) Pages load on first visit.
const formPage = () =>
  import('./FurnitureFormPage').then((m) => ({ Component: m.FurnitureFormPage }))

export const furnitureRoutes: RouteObject[] = [
  {
    path: '/furniture',
    lazy: () => import('./FurnitureListPage').then((m) => ({ Component: m.FurnitureListPage })),
  },
  { path: '/furniture/add', lazy: formPage },
  { path: '/furniture/update/:id', lazy: formPage },
  {
    path: '/furniture/main/specification/:id',
    lazy: () =>
      import('./SpecificationPage').then((m) => ({ Component: m.FurnitureSpecificationPage })),
  },
]
