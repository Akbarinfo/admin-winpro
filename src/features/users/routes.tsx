import type { RouteObject } from 'react-router'
import { UserFormDialog } from './UserFormDialog'
import { UserListPage } from './UserListPage'

// Same URLs as the old panel: /user, /user/add, /user/update/:id.
export const userRoutes: RouteObject[] = [
  {
    path: '/user',
    element: <UserListPage />,
    children: [
      { path: 'add', element: <UserFormDialog /> },
      { path: 'update/:id', element: <UserFormDialog /> },
    ],
  },
]
