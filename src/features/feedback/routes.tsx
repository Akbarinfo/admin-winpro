import type { RouteObject } from 'react-router'

// Same URL as the old panel. The open conversation is in the URL: /feedback?chat=<userId>.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
export const feedbackRoutes: RouteObject[] = [
  {
    path: '/feedback',
    lazy: () => import('./FeedbackPage').then((m) => ({ Component: m.FeedbackPage })),
  },
]
