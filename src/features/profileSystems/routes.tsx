import type { RouteObject } from 'react-router'

// Same URL as the old panel; the chosen system is in the URL (?system=<id>). The add/edit form is a
// dialog without its own URL — the old panel had none either, so no bookmarks to keep.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
export const profileSystemRoutes: RouteObject[] = [
  {
    path: '/profile_system',
    lazy: () => import('./ProfileSystemsPage').then((m) => ({ Component: m.ProfileSystemsPage })),
  },
]
