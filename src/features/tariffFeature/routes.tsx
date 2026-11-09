import type { RouteObject } from 'react-router'
import { TariffFeatureFormDialog } from './TariffFeatureFormDialog'
import { TariffFeatureListPage } from './TariffFeatureListPage'

// Same URLs as the old panel: /tariff-feature, /tariff-feature/add, /tariff-feature/update/:id.
export const tariffFeatureRoutes: RouteObject[] = [
  {
    path: '/tariff-feature',
    element: <TariffFeatureListPage />,
    children: [
      { path: 'add', element: <TariffFeatureFormDialog /> },
      { path: 'update/:id', element: <TariffFeatureFormDialog /> },
    ],
  },
]
