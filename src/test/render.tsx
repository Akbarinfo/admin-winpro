import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import {
  createMemoryRouter,
  RouterProvider,
  type InitialEntry,
  type RouteObject,
} from 'react-router'

/**
 * Renders a component with a fresh QueryClient and a memory router.
 * Pass `routes` to test nested routes; otherwise `ui` is mounted at `path`.
 * `url` may be a location object to start with history state: `{ pathname, state }`.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    url = '/',
    path = '*',
    routes,
  }: { url?: InitialEntry; path?: string; routes?: RouteObject[] } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(routes ?? [{ path, element: ui }], { initialEntries: [url] })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...result, router, queryClient }
}
