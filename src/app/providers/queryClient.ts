import { QueryClient } from '@tanstack/react-query'
import { useSession } from '@/shared/store/session'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

// After logout, drop cached data so the next user doesn't see it.
useSession.subscribe((state, prev) => {
  if (prev.token && !state.token) queryClient.clear()
})
