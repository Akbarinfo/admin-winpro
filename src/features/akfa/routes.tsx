import type { RouteObject } from 'react-router'

// Same URL as the old panel. Pages load on first visit (their own chunk); translations come from index.ts.
const unitDialog = () =>
  import('./UnitMappingDialog').then((m) => ({ Component: m.UnitMappingDialog }))

export const akfaRoutes: RouteObject[] = [
  {
    path: '/integrations/akfa',
    lazy: () => import('./AkfaPage').then((m) => ({ Component: m.AkfaPage })),
  },
  {
    // Akfa units ↔ WinPro units; add / update/:id open a dialog over the list.
    path: '/integrations/unit',
    lazy: () =>
      import('./UnitMappingListPage').then((m) => ({ Component: m.UnitMappingListPage })),
    children: [
      { path: 'add', lazy: unitDialog },
      { path: 'update/:id', lazy: unitDialog },
    ],
  },
]
