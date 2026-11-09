import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react'
import { useSession } from '@/shared/store/session'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

export function UserMenu() {
  const { t } = useTranslation()
  const user = useSession((s) => s.user)
  const logout = useSession((s) => s.logout)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const name = user?.fullName || user?.username || ''
  const contact = user?.email || user?.phone || user?.role

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t('layout.user_menu')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="grid size-8 place-items-center rounded-full bg-primary text-[13px] font-semibold text-primary-fg"
      >
        {initials(name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[42px] right-0 z-40 min-w-[220px] rounded-lg border border-line bg-surface p-1.5 shadow-[0_1px_2px_rgb(19_38_42/.06),0_8px_24px_rgb(19_38_42/.08)]"
        >
          {name && (
            <div className="mb-1.5 border-b border-line px-2.5 pt-2 pb-2.5">
              <div className="font-semibold">{name}</div>
              {contact && <div className="text-[12.5px] text-muted">{contact}</div>}
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex h-[34px] w-full items-center gap-2.5 rounded-[6px] px-2.5 text-left text-danger hover:bg-surface-2"
          >
            <LogOut size={18} aria-hidden="true" />
            {t('layout.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
