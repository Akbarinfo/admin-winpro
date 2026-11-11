import type { RouteObject } from 'react-router'

// Same URL as the old panel. Pages load on first visit (their own chunk);
// translations are registered up front by index.ts.
export const priceRequestRoutes: RouteObject[] = [
  {
    path: '/price-requests',
    lazy: () =>
      import('./PriceRequestListPage').then((m) => ({ Component: m.PriceRequestListPage })),
  },
]
