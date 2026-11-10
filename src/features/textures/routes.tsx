import { Navigate, type RouteObject } from 'react-router'

// Same URLs as the old panel: /textures, /textures/add, /textures/update/:id.
// Pages load on first visit (their own chunk); translations are registered up front by index.ts.
const formDialog = () =>
  import('./TextureFormDialog').then((m) => ({ Component: m.TextureFormDialog }))

export const textureRoutes: RouteObject[] = [
  {
    path: '/textures',
    lazy: () => import('./TextureListPage').then((m) => ({ Component: m.TextureListPage })),
    children: [
      {
        path: 'add',
        lazy: formDialog,
      },
      {
        path: 'update/:id',
        lazy: formDialog,
      },
    ],
  },
  // The old «texture groups» page was a copy of the textures list on the same endpoint.
  { path: '/texturegroup/*', element: <Navigate to="/textures" replace /> },
]
