import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { Toaster } from 'sonner'
import { queryClient } from './queryClient'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Toast settings live here once — call sites only use toast.success(...) */}
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  )
}
