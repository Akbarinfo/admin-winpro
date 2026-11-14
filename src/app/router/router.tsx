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
import { akfaRoutes } from '@/features/akfa'
import { connectionRoutes } from '@/features/connection'
import { fillingRoutes } from '@/features/fillingGroups'
import { furnitureRoutes } from '@/features/furniture'
import { insertRoutes } from '@/features/inserts'
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
  ...akfaRoutes,
  ...connectionRoutes,
  ...insertRoutes,
  ...fillingRoutes,
  ...furnitureRoutes,
]

// The home page: the sections opened last.
const homeRoute = {
  path: '/',
  lazy: () => import('../home/HomePage').then((m) => ({ Component: m.HomePage })),
}

// Every other menu section shows «being migrated» until its feature is added above.
const placeholderRoutes = NAV_ITEMS.filter((item) => item.to !== '/').map((item) => ({
  path: `${item.to}/*`,
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
          homeRoute,
          ...featureRoutes,
          ...placeholderRoutes,
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
