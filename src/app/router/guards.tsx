import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSession } from '@/shared/store/session'

/** Signed-out users go to /login; after login they return to the page they asked for. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token)
  const location = useLocation()
  if (!token)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}

/** Signed-in users don't see the login and password-reset pages. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const token = useSession((s) => s.token)
  if (token) return <Navigate to="/" replace />
  return children
}
