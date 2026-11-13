import type { RouteObject } from 'react-router'

// Same URL as the old panel. Pages load on first visit (their own chunk); translations come from index.ts.
export const akfaRoutes: RouteObject[] = [
  {
    path: '/integrations/akfa',
    lazy: () => import('./AkfaPage').then((m) => ({ Component: m.AkfaPage })),
  },
]
