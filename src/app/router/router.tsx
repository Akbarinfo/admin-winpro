import { createBrowserRouter } from 'react-router'
import { appVersionRoutes } from '@/features/appVersions'
import { AuthLayout, authRoutes } from '@/features/auth'
import { countryRoutes } from '@/features/countries'
import { currencyRoutes } from '@/features/currency'
import { exchangeRoutes } from '@/features/exchange'
import { languageRoutes } from '@/features/languages'
import { materialTypeRoutes } from '@/features/materialType'
import { mobileUserRoutes } from '@/features/mobileUsers'
import { salesCategoryRoutes } from '@/features/salesCategory'
import { seriesRoutes } from '@/features/series'
import { supplierRoutes } from '@/features/suppliers'
import { tariffFeatureRoutes } from '@/features/tariffFeature'
import { textureRoutes } from '@/features/textures'
import { unitRoutes } from '@/features/units'
import { userRoutes } from '@/features/users'
import { workshopServiceRoutes } from '@/features/workshopService'
import { AppLayout } from '../layout/AppLayout'
import { NAV_ITEMS } from '../layout/nav'
import { GuestOnly, RequireAuth } from './guards'
import { ComingSoonPage, ErrorScreen, NotFoundPage } from './pages'

// Migrated sections. Their paths are more specific than the placeholders' splats, so they win.
const featureRoutes = [
  ...currencyRoutes,
  ...exchangeRoutes,
  ...unitRoutes,
  ...seriesRoutes,
  ...materialTypeRoutes,
  ...languageRoutes,
  ...supplierRoutes,
  ...workshopServiceRoutes,
  ...tariffFeatureRoutes,
  ...textureRoutes,
  ...salesCategoryRoutes,
  ...countryRoutes,
  ...appVersionRoutes,
  ...userRoutes,
  ...mobileUserRoutes,
]

// Dev-only pages; lazy so they never reach the production bundle.
const devRoutes = import.meta.env.DEV
  ? [
      {
        path: '/ui-kit',
        lazy: () => import('../dev/UiKitPage').then((m) => ({ Component: m.UiKitPage })),
      },
    ]
  : []

// Every other menu section shows «being migrated» until its feature is added above.
const placeholderRoutes = NAV_ITEMS.map((item) => ({
  path: item.to === '/' ? '/' : `${item.to}/*`,
  element: <ComingSoonPage />,
}))

export const router = createBrowserRouter([
  {
    errorElement: <ErrorScreen />,
    children: [
      {
        element: (
          <GuestOnly>
            <AuthLayout />
          </GuestOnly>
        ),
        children: authRoutes,
      },
      {
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          ...featureRoutes,
          ...devRoutes,
          ...placeholderRoutes,
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
