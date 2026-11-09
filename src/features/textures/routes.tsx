import { Navigate, type RouteObject } from 'react-router'
import { TextureFormDialog } from './TextureFormDialog'
import { TextureListPage } from './TextureListPage'

// Same URLs as the old panel: /textures, /textures/add, /textures/update/:id.
export const textureRoutes: RouteObject[] = [
  {
    path: '/textures',
    element: <TextureListPage />,
    children: [
      { path: 'add', element: <TextureFormDialog /> },
      { path: 'update/:id', element: <TextureFormDialog /> },
    ],
  },
  // The old «texture groups» page was a copy of the textures list on the same endpoint.
  { path: '/texturegroup/*', element: <Navigate to="/textures" replace /> },
]
