import type { RouteObject } from 'react-router'

// Same URLs as the old panel («templetes»). The form has the constructor, so it's a page.
// Pages load on first visit (their own chunk — webcc in the form's); translations come from index.ts.
const formPage = () =>
  import('./DrawingTemplateFormPage').then((m) => ({ Component: m.DrawingTemplateFormPage }))

export const drawingTemplateRoutes: RouteObject[] = [
  {
    path: '/templetes',
    lazy: () =>
      import('./DrawingTemplateListPage').then((m) => ({ Component: m.DrawingTemplateListPage })),
  },
  { path: '/templetes/add', lazy: formPage },
  { path: '/templetes/update/:id', lazy: formPage },
]
