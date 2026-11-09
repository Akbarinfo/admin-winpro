import { createBrowserRouter } from 'react-router'
import { AuthLayout, authRoutes } from '@/features/auth'
import { AppLayout } from '../layout/AppLayout'
import { NAV_ITEMS } from '../layout/nav'
import { GuestOnly, RequireAuth } from './guards'
import { ComingSoonPage, ErrorScreen, NotFoundPage } from './pages'

// Every menu section starts as a placeholder; a migrated feature replaces its entry
// by spreading its own routes (e.g. ...exchangeRoutes) above the placeholders.
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
        children: [...placeholderRoutes, { path: '*', element: <NotFoundPage /> }],
      },
    ],
  },
])
