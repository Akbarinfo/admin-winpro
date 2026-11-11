import type { RouteObject } from 'react-router'

// Same URLs as the old panel. The form has the constructor (and a parent its children), so it's a
// page. Pages load on first visit (their own chunk — webcc in the form's); translations come from index.ts.
const formPage = () => import('./TemplateFormPage').then((m) => ({ Component: m.TemplateFormPage }))

export const templateRoutes: RouteObject[] = [
  {
    path: '/templates',
    lazy: () => import('./TemplateListPage').then((m) => ({ Component: m.TemplateListPage })),
  },
  { path: '/templates/add', lazy: formPage },
  { path: '/templates/update/:id', lazy: formPage },
  { path: '/templates/update/:parentId/add-child', lazy: formPage },
  { path: '/templates/update/:parentId/update-child/:id', lazy: formPage },
]
