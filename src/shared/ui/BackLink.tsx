import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useListUrl } from '@/shared/hooks/useListUrl'

/** «← К списку…» above a page: back to the list as it was left (search, page, filters). */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  const href = useListUrl(to)
  return (
    <Link to={href} className="inline-flex w-fit items-center gap-1.5 text-muted hover:text-fg">
      <ArrowLeft size={16} />
      {children}
    </Link>
  )
}
