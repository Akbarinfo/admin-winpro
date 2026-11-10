import type { RouteObject } from 'react-router'

// Same URL as the old panel. A list only: mobile users sign up in the app.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
export const mobileUserRoutes: RouteObject[] = [
  {
    path: '/mobile_user',
    lazy: () => import('./MobileUserListPage').then((m) => ({ Component: m.MobileUserListPage })),
  },
]
