import { createBrowserRouter } from 'react-router'
import { appVersionRoutes } from '@/features/appVersions'
import { AuthLayout, authRoutes } from '@/features/auth'
import { countryRoutes } from '@/features/countries'
import { currencyRoutes } from '@/features/currency'
import { exchangeRoutes } from '@/features/exchange'
import { feedbackRoutes } from '@/features/feedback'
import { languageRoutes } from '@/features/languages'
import { materialTypeRoutes } from '@/features/materialType'
import { mobileUserRoutes } from '@/features/mobileUsers'
import { priceRequestRoutes } from '@/features/priceRequests'
import { productRoutes } from '@/features/product'
import { profileSystemRoutes } from '@/features/profileSystems'
import { templateRoutes } from '@/features/templates'
import { drawingTemplateRoutes } from '@/features/drawingTemplates'
import { translationRoutes } from '@/features/translationKeys'
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
import { ComingSoonPage, ErrorScreen, NotFoundPage, PageLoading } from './pages'

// Migrated sections. Their paths are more specific than the placeholders' splats, so they win.
// Each section's pages are lazy (see its routes.tsx); its translations load with this import.
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
  ...productRoutes,
  ...feedbackRoutes,
  ...priceRequestRoutes,
  ...profileSystemRoutes,
  ...templateRoutes,
  ...drawingTemplateRoutes,
  ...translationRoutes,
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
    // Sections are lazy (their own chunks): shown while the first page's code loads.
    hydrateFallbackElement: <PageLoading />,
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
