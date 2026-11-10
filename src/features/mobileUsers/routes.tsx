import type { RouteObject } from 'react-router'
import { MobileUserListPage } from './MobileUserListPage'

// Same URL as the old panel. A list only: mobile users sign up in the app.
export const mobileUserRoutes: RouteObject[] = [
  { path: '/mobile_user', element: <MobileUserListPage /> },
]
